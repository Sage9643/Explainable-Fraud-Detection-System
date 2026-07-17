"""
Batch prediction service.

Reuses prediction_service.predict_fraud_probabilities (vectorized) and
risk_service.classify_risk row-by-row - no prediction or risk-classification
logic is reimplemented here. Scored results are written to disk as a CSV
immediately; only lightweight metadata is kept afterward (via
database/batch_crud.py), so process memory usage stays flat regardless of
batch size and downloads survive a server restart.

Batch predictions are never written to prediction_history - they are a
separate, ephemeral-on-disk concern by design.

Performance note (why this file looks different from a naive per-row loop):
the original implementation constructed one TransactionRequest (pydantic
validation), one single-row DataFrame, one scaler.transform() call, and one
model.predict_proba() call PER ROW. For the ~285k-row Kaggle dataset that is
~285k Python object constructions and ~285k separate calls into pandas/
XGBoost, each carrying fixed per-call overhead - the overhead dominates, not
the actual math. Scoring is now done with exactly one scaler.transform()
call and one model.predict_proba() call for the entire file, via
prediction_service.predict_fraud_probabilities(). Risk classification still
calls risk_service.classify_risk() once per row (unchanged, reused as-is)
because that function is cheap (a few float comparisons and a dict lookup) -
it was never the bottleneck, so it does not need to change.
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd

from database import batch_crud
from database.db import get_connection
from services.model_service import ModelService
from services.prediction_service import predict_fraud_probabilities
from services.risk_service import classify_risk
from utils.config import get_settings
from utils.exceptions import InvalidTransactionError

REQUIRED_COLUMNS = [f"V{i}" for i in range(1, 29)] + ["Amount"]

OUTPUT_COLUMNS = REQUIRED_COLUMNS + [
    "prediction",
    "fraud_probability",
    "confidence",
    "risk_band",
    "recommended_action",
]


def _ensure_output_dir() -> Path:
    output_dir = get_settings().batch_output_path
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _validate_csv(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise InvalidTransactionError(f"CSV is missing required column(s): {', '.join(missing)}")

    if len(df) == 0:
        raise InvalidTransactionError("CSV contains no data rows.")

    max_rows = get_settings().max_batch_rows
    if len(df) > max_rows:
        raise InvalidTransactionError(
            f"CSV contains {len(df)} rows, exceeding the maximum of {max_rows}."
        )

    # Vectorized numeric check (column-wise, not a Python loop over rows).
    numeric_view = df[REQUIRED_COLUMNS].apply(pd.to_numeric, errors="coerce")
    non_numeric = numeric_view.isna()
    if non_numeric.any().any():
        bad_rows = int(non_numeric.any(axis=1).sum())
        raise InvalidTransactionError(
            f"CSV contains non-numeric values in one or more required columns "
            f"(affects {bad_rows} row(s))."
        )

    # Mirrors TransactionRequest's Amount >= 0 constraint (the same rule the
    # single-transaction /api/predict endpoint enforces via Pydantic), applied
    # vectorized instead of via per-row model construction.
    negative_amounts = numeric_view["Amount"] < 0
    if negative_amounts.any():
        bad_count = int(negative_amounts.sum())
        raise InvalidTransactionError(
            f"CSV contains {bad_count} row(s) with a negative Amount value."
        )


def score_batch(file_bytes: bytes, model_service: ModelService) -> dict:
    start = time.monotonic()

    try:
        df = pd.read_csv(BytesIO(file_bytes))
    except Exception as exc:  # noqa: BLE001
        raise InvalidTransactionError(f"Could not parse CSV: {exc}") from exc

    _validate_csv(df)

    metadata = model_service.get_metadata()
    risk_bands = metadata["risk_bands"]
    threshold = metadata["decision_threshold"]

    features_df = df[REQUIRED_COLUMNS]

    # One vectorized scoring pass for the entire file - see module docstring.
    probabilities = predict_fraud_probabilities(features_df, model_service)

    predictions = np.where(probabilities >= threshold, "Fraudulent", "Legitimate")
    confidences = np.maximum(probabilities, 1 - probabilities)

    # classify_risk is reused exactly as /api/predict uses it - unchanged,
    # not reimplemented. It is cheap enough (float comparisons + dict
    # lookups) that a plain Python loop over ~285k rows is not the
    # bottleneck; the bottleneck was always the per-row model/scaler calls
    # eliminated above.
    risk_band_values: list[str] = [None] * len(probabilities)
    recommended_actions: list[str] = [None] * len(probabilities)
    for i, probability in enumerate(probabilities):
        risk = classify_risk(float(probability), risk_bands)
        risk_band_values[i] = risk.risk_band
        recommended_actions[i] = risk.recommended_action

    df["prediction"] = predictions
    df["fraud_probability"] = np.round(probabilities, 6)
    df["confidence"] = np.round(confidences, 6)
    df["risk_band"] = risk_band_values
    df["recommended_action"] = recommended_actions

    rows_scored = len(df)
    fraud_count = int(np.count_nonzero(predictions == "Fraudulent"))
    fraud_rate = round(fraud_count / rows_scored, 6) if rows_scored else 0.0

    risk_band_series = df["risk_band"]
    risk_distribution = [
        {"risk_band": band, "count": int((risk_band_series == band).sum())}
        for band in risk_bands["actions"].keys()
    ]

    batch_id = uuid.uuid4().hex
    output_dir = _ensure_output_dir()
    file_path = output_dir / f"{batch_id}.csv"
    df[OUTPUT_COLUMNS].to_csv(file_path, index=False)

    processing_time_ms = int((time.monotonic() - start) * 1000)
    created_at = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    try:
        batch_crud.create_batch_job(
            conn,
            batch_id=batch_id,
            created_at=created_at,
            file_path=str(file_path),
            rows_scored=rows_scored,
            fraud_count=fraud_count,
            fraud_rate=fraud_rate,
            processing_time_ms=processing_time_ms,
            risk_distribution=risk_distribution,
        )
    finally:
        conn.close()

    return {
        "batch_id": batch_id,
        "rows_scored": rows_scored,
        "fraud_count": fraud_count,
        "fraud_rate": fraud_rate,
        "processing_time_ms": processing_time_ms,
        "risk_distribution": risk_distribution,
    }


def get_batch_download(batch_id: str) -> tuple[Path, str] | None:
    """Returns (file_path, created_at) for a batch, or None if the batch_id
    is unknown or its file is missing from disk."""
    conn = get_connection()
    try:
        job = batch_crud.get_batch_job(conn, batch_id)
    finally:
        conn.close()

    if job is None:
        return None

    path = Path(job["file_path"])
    if not path.exists():
        return None

    return path, job["created_at"]