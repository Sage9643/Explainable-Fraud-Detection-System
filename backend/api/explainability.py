"""
Explainability endpoint.

Thin controller: validates input via the same TransactionRequest schema used
by /predict, delegates to prediction_service for the probability and
explanation_service for SHAP contributions, and composes the response. No
SHAP/model logic lives here.
"""
from __future__ import annotations

from fastapi import APIRouter, Request

from schemas.explainability import ExplanationResponse
from schemas.prediction import TransactionRequest
from services.explanation_service import explain_transaction, summarize_contributions
from services.model_service import model_service
from services.prediction_service import predict_fraud_probability
from services.risk_service import classify_risk

router = APIRouter(tags=["explainability"])


@router.post("/api/explain", response_model=ExplanationResponse)
def explain_prediction(transaction: TransactionRequest, request: Request) -> ExplanationResponse:
    metadata = model_service.get_metadata()

    probability = predict_fraud_probability(transaction, model_service)
    risk = classify_risk(probability, metadata["risk_bands"])
    contributions = explain_transaction(transaction, model_service)
    summary = summarize_contributions(contributions)

    return ExplanationResponse(
        fraud_probability=round(probability, 6),
        risk_band=risk.risk_band,
        top_contributing_features=contributions,
        summary=summary,
        model_version=model_service.get_model_version(),
        request_id=request.state.request_id,
    )
