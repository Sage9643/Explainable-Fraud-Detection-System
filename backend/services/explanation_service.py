"""
Explanation service.

Reuses the SHAP TreeExplainer built once at startup by model_service - never
rebuilds it per request, which would be the single most expensive mistake
possible in this endpoint. Preprocessing is delegated to
prediction_service.preprocess_transaction so training/serving parity is
guaranteed identically for both /predict and /explain.
"""
from __future__ import annotations

import pandas as pd

from schemas.explainability import FeatureContribution
from schemas.prediction import TransactionRequest
from services.model_service import ModelService
from services.prediction_service import preprocess_transaction

DEFAULT_TOP_K = 5


def explain_transaction(
    transaction: TransactionRequest,
    model_service: ModelService,
    top_k: int = DEFAULT_TOP_K,
) -> list[FeatureContribution]:
    explainer = model_service.get_explainer()
    row = preprocess_transaction(transaction, model_service)

    shap_values = explainer.shap_values(row)
    # Some SHAP explainer configurations return a list (one array per class);
    # TreeExplainer on a binary XGBClassifier normally returns a single array
    # already aligned to the positive class, but this keeps the service
    # robust to either shape.
    values = shap_values[1] if isinstance(shap_values, list) else shap_values

    contributions = list(zip(row.columns, values[0], row.values[0]))
    contributions.sort(key=lambda item: abs(item[1]), reverse=True)

    results: list[FeatureContribution] = []
    for feature, shap_val, feat_val in contributions[:top_k]:
        results.append(
            FeatureContribution(
                feature=feature,
                shap_value=round(float(shap_val), 5),
                feature_value=round(float(feat_val), 5),
                direction="increases_risk" if shap_val > 0 else "decreases_risk",
            )
        )
    return results


def summarize_contributions(contributions: list[FeatureContribution]) -> str:
    """Builds a single human-readable sentence from the top contributions -
    the plain-language explanation the frontend's Explainability page will
    display alongside the SHAP bar chart."""
    if not contributions:
        return "No significant contributing features were identified."

    increasing = [c.feature for c in contributions if c.direction == "increases_risk"]
    decreasing = [c.feature for c in contributions if c.direction == "decreases_risk"]

    if increasing and decreasing:
        return (
            f"Risk was primarily increased by {', '.join(increasing)}, "
            f"partially offset by {', '.join(decreasing)}."
        )
    if increasing:
        return f"Risk was primarily increased by {', '.join(increasing)}."
    return f"Risk was primarily decreased by {', '.join(decreasing)}."
