"""
generate_analytics_metadata.py

Standalone developer utility - NOT part of the runtime backend.

Purpose
-------
Enrich the existing, frozen `metadata.json` with analytics artifacts that
Sprint 8 (Model Analytics page) needs to render real charts instead of empty
states: ROC curve points, Precision-Recall curve points, a confusion matrix,
and feature importance (gain-based and SHAP-based).

This script is inference-only. It NEVER calls .fit() on anything, never
retrains the model, and never touches model.json, scaler.pkl, or
feature_columns.json. Its only side effect is patching four new keys into a
copy of metadata.json - every existing key/value in that file is preserved
exactly as-is.

How correctness is guaranteed without retraining
--------------------------------------------------
The original training notebook (FraudLens_AI_Final_Training.ipynb) builds
its test split with a FIXED random seed:

    train_test_split(X, y, test_size=0.20, stratify=y, random_state=42)

That split is deterministic: given the same creditcard.csv and the same
seed, it reproduces the exact same train/test row partition every time. This
script reconstructs that same split, then runs the ALREADY-FROZEN model and
scaler over the reconstructed test set in inference mode only. Before
touching metadata.json at all, it recomputes AUC/Precision/Recall/F1 from
that reconstructed test set and compares them against the values already
stored in metadata.json. If they don't match within a small tolerance, the
script aborts and writes nothing - that mismatch would mean the
reconstructed test set is NOT the same one the frozen model was originally
evaluated on, and proceeding would silently produce wrong analytics data.

Usage
-----
    python scripts/generate_analytics_metadata.py \
        --data-path /path/to/creditcard.csv \
        --artifacts-dir /path/to/backend/models/artifacts

Both arguments have defaults matching this project's layout (see
DEFAULT_DATA_PATH / DEFAULT_ARTIFACTS_DIR below); override them if your
checkout is laid out differently.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    confusion_matrix,
    precision_recall_curve,
    precision_recall_fscore_support,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# --- Defaults matching this project's layout -------------------------------
# scripts/generate_analytics_metadata.py -> project root is one level up.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_PATH = _PROJECT_ROOT / "creditcard.csv"
DEFAULT_ARTIFACTS_DIR = _PROJECT_ROOT / "backend" / "models" / "artifacts"

# --- Reproduction parameters, must match the training notebook exactly -----
# (FraudLens_AI_Final_Training.ipynb, Section 2 Configuration / Section 5
# Preprocessing). Changing these would reconstruct a DIFFERENT test split
# than the one the frozen model was evaluated on, which is exactly what the
# verification step below is designed to catch.
SEED = 42
TEST_SIZE = 0.20
TARGET_COL = "Class"
DROP_COLS = ["Time"]
AMOUNT_COL = "Amount"

# Tolerance for comparing recomputed metrics against the stored ones.
# metadata.json stores metrics rounded to 6 decimal places; 1e-4 is loose
# enough to absorb that rounding while still catching a genuinely different
# test set (which would typically disagree by whole percentage points).
VERIFICATION_TOLERANCE = 1e-4

# Output sizing, per spec: intelligently downsampled, not raw per-threshold
# arrays (a 56,962-row test set can produce tens of thousands of raw
# threshold points, which is far more than any chart or JSON file needs).
ROC_CURVE_POINTS = 80
PR_CURVE_POINTS = 80
TOP_N_FEATURES = 15

# SHAP importance is computed over a sample of the test set, not all of it -
# TreeExplainer.shap_values() cost scales with the number of rows, and a
# representative sample is standard practice for a summary statistic like
# mean(|SHAP value|) per feature. This does not affect gain-based importance
# or any of the verified metrics above.
SHAP_SAMPLE_SIZE = 2000

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("generate_analytics_metadata")


class VerificationError(Exception):
    """Raised when recomputed metrics don't match the stored metadata within
    tolerance. Execution must abort without writing anything when this is
    raised - see main()."""


@dataclass
class LoadedArtifacts:
    model: XGBClassifier
    scaler: Any
    feature_columns: list[str]
    metadata: dict[str, Any]


# ---------------------------------------------------------------------------
# Step 1-4: Load existing frozen artifacts (read-only, nothing is fit here)
# ---------------------------------------------------------------------------
def load_artifacts(artifacts_dir: Path) -> LoadedArtifacts:
    model_path = artifacts_dir / "model.json"
    scaler_path = artifacts_dir / "scaler.pkl"
    feature_columns_path = artifacts_dir / "feature_columns.json"
    metadata_path = artifacts_dir / "metadata.json"

    for path in (model_path, scaler_path, feature_columns_path, metadata_path):
        if not path.exists():
            raise FileNotFoundError(f"Required artifact not found: {path}")

    model = XGBClassifier()
    model.load_model(str(model_path))  # inference-ready load, not a fit
    logger.info("Loaded frozen model from %s", model_path)

    import joblib

    scaler = joblib.load(scaler_path)  # loaded as-is, never refit
    logger.info("Loaded frozen scaler from %s", scaler_path)

    with open(feature_columns_path) as f:
        feature_columns = json.load(f)
    logger.info("Loaded feature_columns.json (%d features)", len(feature_columns))

    with open(metadata_path) as f:
        metadata = json.load(f)
    logger.info("Loaded metadata.json")

    return LoadedArtifacts(
        model=model, scaler=scaler, feature_columns=feature_columns, metadata=metadata
    )


# ---------------------------------------------------------------------------
# Step 5-6: Reload the dataset and reconstruct the deterministic test split
# ---------------------------------------------------------------------------
def reconstruct_test_split(data_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {data_path}. Pass --data-path to point at "
            f"your local copy of creditcard.csv."
        )

    df = pd.read_csv(data_path)
    df_model = df.drop(columns=DROP_COLS)
    X = df_model.drop(columns=[TARGET_COL])
    y = df_model[TARGET_COL]

    # Deterministic given SEED - reproduces the exact same test partition
    # the training notebook produced, without fitting anything.
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=SEED
    )

    logger.info("Reconstructed deterministic test split: %d rows", len(X_test))
    return X_test, y_test


# ---------------------------------------------------------------------------
# Step 7: Run inference only (no fitting) using the frozen model + scaler
# ---------------------------------------------------------------------------
def run_inference(
    X_test: pd.DataFrame, artifacts: LoadedArtifacts
) -> np.ndarray:
    working = X_test.copy()
    # scaler.transform(), never scaler.fit_transform() - reuses the exact
    # fitted parameters saved at training time.
    working["Amount_scaled"] = artifacts.scaler.transform(working[[AMOUNT_COL]])
    working = working.drop(columns=[AMOUNT_COL])
    working = working[artifacts.feature_columns]

    test_prob = artifacts.model.predict_proba(working)[:, 1]
    logger.info("Ran inference on reconstructed test set (no training performed)")
    return test_prob


# ---------------------------------------------------------------------------
# Step 8-9: Recompute metrics and verify against the stored metadata
# ---------------------------------------------------------------------------
def verify_against_stored_metadata(
    y_test: pd.Series, test_prob: np.ndarray, stored_metrics: dict[str, Any], threshold: float
) -> dict[str, float]:
    test_pred = (test_prob >= threshold).astype(int)

    recomputed = {
        "test_auc": float(roc_auc_score(y_test, test_prob)),
    }
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, test_pred, average="binary", zero_division=0
    )
    recomputed["test_precision"] = float(precision)
    recomputed["test_recall"] = float(recall)
    recomputed["test_f1"] = float(f1)

    mismatches = []
    for key, recomputed_value in recomputed.items():
        stored_value = stored_metrics.get(key)
        if stored_value is None:
            mismatches.append(f"  - '{key}' is missing from stored metadata entirely")
            continue
        diff = abs(recomputed_value - float(stored_value))
        if diff > VERIFICATION_TOLERANCE:
            mismatches.append(
                f"  - {key}: stored={stored_value:.6f} recomputed={recomputed_value:.6f} "
                f"(diff={diff:.6f} > tolerance={VERIFICATION_TOLERANCE})"
            )

    if mismatches:
        raise VerificationError(
            "Recomputed metrics do not match metadata.json within tolerance.\n"
            "This means the reconstructed test set is NOT the same one the frozen "
            "model was originally evaluated on - possible causes: a different "
            "creditcard.csv than the one used at training time, a different "
            "scikit-learn version affecting train_test_split's shuffling, or the "
            "SEED/TEST_SIZE constants in this script drifting from the notebook.\n"
            "Aborting WITHOUT writing metadata.json.\n\n"
            "Mismatches:\n" + "\n".join(mismatches)
        )

    logger.info("Verification passed:")
    for key in ("test_auc", "test_precision", "test_recall", "test_f1"):
        logger.info("  %s matches stored metadata (%.6f)", key, recomputed[key])

    return recomputed


# ---------------------------------------------------------------------------
# Curve downsampling (shared by ROC and PR generation - avoids duplicating
# the same "pick N representative points" logic twice)
# ---------------------------------------------------------------------------
def _downsample_indices(length: int, n_points: int) -> np.ndarray:
    """Returns up to n_points evenly-spaced indices into an array of the
    given length, always including index 0 and the last index."""
    if length <= n_points:
        return np.arange(length)
    indices = np.linspace(0, length - 1, num=n_points)
    return np.unique(np.round(indices).astype(int))


def _json_safe_float(value: float) -> float | None:
    """JSON has no representation for inf/-inf/nan; sklearn's roc_curve can
    emit an infinite first threshold by construction. Convert to None rather
    than silently producing invalid JSON or a misleading sentinel number."""
    if value is None or not np.isfinite(value):
        return None
    return float(value)


# ---------------------------------------------------------------------------
# ROC curve
# ---------------------------------------------------------------------------
def generate_roc_curve(y_test: pd.Series, test_prob: np.ndarray) -> list[dict[str, float | None]]:
    fpr, tpr, thresholds = roc_curve(y_test, test_prob)
    idx = _downsample_indices(len(fpr), ROC_CURVE_POINTS)

    points = [
        {
            "fpr": round(float(fpr[i]), 6),
            "tpr": round(float(tpr[i]), 6),
            "threshold": round(_json_safe_float(thresholds[i]), 6)
            if _json_safe_float(thresholds[i]) is not None
            else None,
        }
        for i in idx
    ]
    logger.info("Generated ROC curve (%d points)", len(points))
    return points


# ---------------------------------------------------------------------------
# Precision-Recall curve
# ---------------------------------------------------------------------------
def generate_pr_curve(y_test: pd.Series, test_prob: np.ndarray) -> list[dict[str, float | None]]:
    precision, recall, thresholds = precision_recall_curve(y_test, test_prob)
    # precision/recall have one more element than thresholds (the final
    # point is a boundary artifact with no associated threshold) - align by
    # dropping that final point so every retained point has a real threshold.
    usable_length = len(thresholds)
    idx = _downsample_indices(usable_length, PR_CURVE_POINTS)

    points = [
        {
            "precision": round(float(precision[i]), 6),
            "recall": round(float(recall[i]), 6),
            "threshold": round(float(thresholds[i]), 6),
        }
        for i in idx
    ]
    logger.info("Generated PR curve (%d points)", len(points))
    return points


# ---------------------------------------------------------------------------
# Confusion matrix
# ---------------------------------------------------------------------------
def generate_confusion_matrix(
    y_test: pd.Series, test_prob: np.ndarray, threshold: float
) -> dict[str, int]:
    test_pred = (test_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, test_pred).ravel()

    result = {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }
    logger.info("Generated confusion matrix: %s", result)
    return result


# ---------------------------------------------------------------------------
# Feature importance (gain-based: read directly from the frozen booster,
# no inference needed; SHAP-based: inference-only over a sample of X_test)
# ---------------------------------------------------------------------------
def generate_feature_importance(
    model: XGBClassifier, X_test_processed: pd.DataFrame
) -> dict[str, list[dict[str, float]]]:
    gain_scores = model.get_booster().get_score(importance_type="gain")
    gain_series = pd.Series(gain_scores).sort_values(ascending=False)
    gain_top = [
        {"feature": feature, "importance": round(float(value), 6)}
        for feature, value in gain_series.head(TOP_N_FEATURES).items()
    ]
    logger.info("Computed gain-based feature importance (top %d)", len(gain_top))

    try:
        import shap

        sample_size = min(SHAP_SAMPLE_SIZE, len(X_test_processed))
        sample = X_test_processed.sample(n=sample_size, random_state=SEED)

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(sample)
        # TreeExplainer on a binary XGBClassifier can return either a single
        # array or a list of per-class arrays depending on the shap version;
        # handle both without assuming one shape.
        values = shap_values[1] if isinstance(shap_values, list) else shap_values

        shap_importance = pd.Series(
            np.abs(values).mean(axis=0), index=sample.columns
        ).sort_values(ascending=False)
        shap_top = [
            {"feature": feature, "importance": round(float(value), 6)}
            for feature, value in shap_importance.head(TOP_N_FEATURES).items()
        ]
        logger.info(
            "Computed SHAP-based feature importance (top %d, sample_size=%d)",
            len(shap_top),
            sample_size,
        )
    except ImportError:
        logger.warning("shap is not installed - skipping SHAP-based feature importance")
        shap_top = []

    return {"gain": gain_top, "shap": shap_top}


# ---------------------------------------------------------------------------
# Patch metadata.json: preserve every existing field, append only new keys
# ---------------------------------------------------------------------------
def patch_metadata(
    metadata_path: Path,
    original_metadata: dict[str, Any],
    roc_curve_points: list[dict],
    pr_curve_points: list[dict],
    confusion_matrix_dict: dict[str, int],
    feature_importance_dict: dict[str, list[dict]],
) -> None:
    enriched = dict(original_metadata)  # shallow copy - existing keys untouched
    enriched["roc_curve"] = roc_curve_points
    enriched["pr_curve"] = pr_curve_points
    enriched["confusion_matrix"] = confusion_matrix_dict
    enriched["feature_importance"] = feature_importance_dict

    with open(metadata_path, "w") as f:
        json.dump(enriched, f, indent=2)

    logger.info("Successfully patched metadata.json at %s", metadata_path)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Enrich metadata.json with ROC/PR curves, confusion matrix, "
        "and feature importance. Inference-only - never retrains the model."
    )
    parser.add_argument(
        "--data-path",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help=f"Path to creditcard.csv (default: {DEFAULT_DATA_PATH})",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=DEFAULT_ARTIFACTS_DIR,
        help=f"Path to the artifacts directory containing model.json, scaler.pkl, "
        f"feature_columns.json, metadata.json (default: {DEFAULT_ARTIFACTS_DIR})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        artifacts = load_artifacts(args.artifacts_dir)
        print("Loaded frozen model")
        print("Loaded frozen scaler")
        print("Loaded metadata.json")

        X_test, y_test = reconstruct_test_split(args.data_path)
        print("Reconstructed deterministic test split")

        test_prob = run_inference(X_test, artifacts)

        threshold = artifacts.metadata["decision_threshold"]
        stored_metrics = artifacts.metadata.get("evaluation_metrics", {})

        verify_against_stored_metadata(y_test, test_prob, stored_metrics, threshold)
        print("Verification passed")
        print("AUC matches existing metadata")
        print("Precision matches existing metadata")
        print("Recall matches existing metadata")
        print("F1 matches existing metadata")

        roc_curve_points = generate_roc_curve(y_test, test_prob)
        print(f"Generated ROC curve ({len(roc_curve_points)} points)")

        pr_curve_points = generate_pr_curve(y_test, test_prob)
        print(f"Generated PR curve ({len(pr_curve_points)} points)")

        confusion_matrix_dict = generate_confusion_matrix(y_test, test_prob, threshold)
        print("Generated confusion matrix")

        # Rebuild the processed (scaled + reindexed) test frame once more for
        # SHAP - reuses the exact same transformation run_inference() used,
        # just kept as a separate call so run_inference()'s return type stays
        # a plain probability array rather than also smuggling out a
        # DataFrame it doesn't otherwise need to expose.
        working = X_test.copy()
        working["Amount_scaled"] = artifacts.scaler.transform(working[[AMOUNT_COL]])
        working = working.drop(columns=[AMOUNT_COL])
        working = working[artifacts.feature_columns]

        feature_importance_dict = generate_feature_importance(artifacts.model, working)
        print("Generated feature importance")

        patch_metadata(
            args.artifacts_dir / "metadata.json",
            artifacts.metadata,
            roc_curve_points,
            pr_curve_points,
            confusion_matrix_dict,
            feature_importance_dict,
        )
        print("Successfully patched metadata.json")

        return 0

    except VerificationError as exc:
        logger.error("%s", exc)
        print("\nABORTED: verification failed. metadata.json was NOT modified.")
        return 1

    except (FileNotFoundError, KeyError) as exc:
        logger.error("Precondition not met: %s", exc)
        print(f"\nABORTED: {exc}\nmetadata.json was NOT modified.")
        return 1


if __name__ == "__main__":
    sys.exit(main())