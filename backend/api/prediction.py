"""
Prediction endpoint.

Route contains no ML logic: it validates the request via Pydantic, calls
prediction_service for the probability, calls risk_service to translate that
probability into a business decision, and returns the response. No pandas /
sklearn / xgboost imports here.
"""
from __future__ import annotations

from fastapi import APIRouter, Request

from schemas.prediction import PredictionResponse, TransactionRequest
from services.model_service import model_service
from services.prediction_service import predict_fraud_probability
from services.risk_service import classify_risk

router = APIRouter(tags=["prediction"])


@router.post("/api/predict", response_model=PredictionResponse)
def predict_transaction(transaction: TransactionRequest, request: Request) -> PredictionResponse:
    metadata = model_service.get_metadata()

    probability = predict_fraud_probability(transaction, model_service)
    risk = classify_risk(probability, metadata["risk_bands"])

    threshold = metadata["decision_threshold"]
    prediction_label = "Fraudulent" if probability >= threshold else "Legitimate"

    return PredictionResponse(
        prediction=prediction_label,
        fraud_probability=round(probability, 6),
        risk_band=risk.risk_band,
        recommended_action=risk.recommended_action,
        decision_threshold=threshold,
        model_version=model_service.get_model_version(),
        request_id=request.state.request_id,
    )
