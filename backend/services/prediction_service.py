"""
Prediction service.

Takes a validated transaction and returns a raw fraud probability. Deliberately
does not know about risk bands or recommended actions (that's risk_service's
job) - this keeps "what does the model say" separate from "what do we do
about it," so either can change independently.

Preprocessing here must mirror training exactly:
  1. Scale Amount with the FITTED scaler (never refit).
  2. Drop raw Amount, keep Amount_scaled.
  3. Reindex columns to feature_columns.json order before calling the model.
"""
from __future__ import annotations

import pandas as pd

from schemas.prediction import TransactionRequest
from services.model_service import ModelService


def preprocess_transaction(transaction: TransactionRequest, model_service: ModelService) -> pd.DataFrame:
    """Applies the exact training-time preprocessing to a single transaction
    and returns a one-row DataFrame ready to feed into the model or the SHAP
    explainer. Shared by prediction_service and explanation_service so the
    two never risk drifting apart."""
    scaler = model_service.get_scaler()
    feature_columns = model_service.get_feature_columns()

    row = pd.DataFrame([transaction.model_dump()])

    row["Amount_scaled"] = scaler.transform(row[["Amount"]])
    row = row.drop(columns=["Amount"])

    # Reindex to the exact training-time column order. If a required column
    # is somehow missing this raises a KeyError, which is correct: it means
    # the request schema and the frozen artifacts have drifted apart.
    row = row[feature_columns]
    return row


def predict_fraud_probability(transaction: TransactionRequest, model_service: ModelService) -> float:
    model = model_service.get_model()
    row = preprocess_transaction(transaction, model_service)
    probability = float(model.predict_proba(row)[:, 1][0])
    return probability
