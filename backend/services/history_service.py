"""
History service.

Owns the business logic around prediction history: computing confidence,
timestamping, and translating raw sqlite3 rows into the API's response
schema. database/crud.py stays limited to raw SQL only.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from database import crud
from database.db import get_connection
from schemas.history import HistoryRecord, HistoryResponse
from utils.logger import get_logger

logger = get_logger(__name__)


def record_prediction(
    *,
    prediction: str,
    fraud_probability: float,
    risk_band: str,
    recommended_action: str,
    model_version: str,
    features: dict[str, Any],
) -> None:
    """Persists a single prediction. Called automatically after every
    successful /api/predict call - never invoked directly as its own route.

    History persistence is intentionally isolated from the prediction path:
    a failure here is logged, not raised, so a database hiccup can never
    turn a successful prediction into a failed API response.
    """
    confidence = max(fraud_probability, 1 - fraud_probability)
    timestamp = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    try:
        crud.create_prediction_record(
            conn,
            timestamp=timestamp,
            prediction=prediction,
            fraud_probability=fraud_probability,
            risk_band=risk_band,
            confidence=confidence,
            recommended_action=recommended_action,
            model_version=model_version,
            features=features,
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to persist prediction history")
    finally:
        conn.close()


def get_history(
    *,
    page: int,
    page_size: int,
    risk_band: str | None,
    search: str | None,
) -> HistoryResponse:
    conn = get_connection()
    try:
        rows, total = crud.list_predictions(
            conn, page=page, page_size=page_size, risk_band=risk_band, search=search
        )
    finally:
        conn.close()

    items = [
        HistoryRecord(
            id=row["id"],
            timestamp=row["timestamp"],
            prediction=row["prediction"],
            fraud_probability=row["fraud_probability"],
            risk_band=row["risk_band"],
            confidence=row["confidence"],
            recommended_action=row["recommended_action"],
            model_version=row["model_version"],
        )
        for row in rows
    ]

    return HistoryResponse(items=items, total=total, page=page, page_size=page_size)