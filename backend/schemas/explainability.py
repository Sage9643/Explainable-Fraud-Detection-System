from __future__ import annotations

from pydantic import BaseModel


class FeatureContribution(BaseModel):
    feature: str
    shap_value: float
    feature_value: float
    direction: str  # "increases_risk" | "decreases_risk"


class ExplanationResponse(BaseModel):
    fraud_probability: float
    risk_band: str
    top_contributing_features: list[FeatureContribution]
    summary: str
    model_version: str
    request_id: str
