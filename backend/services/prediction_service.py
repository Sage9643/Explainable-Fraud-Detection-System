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

import numpy as np
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


def preprocess_transactions(features_df: pd.DataFrame, model_service: ModelService) -> pd.DataFrame:
    """Vectorized counterpart to preprocess_transaction: applies the identical
    three preprocessing steps (scale Amount with the fitted scaler, drop raw
    Amount, reindex to feature_columns.json order) to an entire DataFrame of
    transactions at once, instead of one row at a time.

    This is the same transformation as preprocess_transaction - same scaler
    object, same feature_columns, same reindex step - generalized to N rows.
    It exists so batch scoring can call the scaler and model once each
    instead of once per row, which is what makes scoring the full ~285k-row
    Kaggle dataset practical.
    """
    scaler = model_service.get_scaler()
    feature_columns = model_service.get_feature_columns()

    working = features_df.copy()
    working["Amount_scaled"] = scaler.transform(working[["Amount"]])
    working = working.drop(columns=["Amount"])
    working = working[feature_columns]
    return working


def predict_fraud_probabilities(features_df: pd.DataFrame, model_service: ModelService) -> np.ndarray:
    """Vectorized counterpart to predict_fraud_probability: scores an entire
    DataFrame of transactions with a single model.predict_proba() call
    instead of one call per row. Produces numerically identical results to
    calling predict_fraud_probability() once per row, in the same row order,
    because it uses the same fitted scaler and the same trained model - only
    the number of rows passed to each call differs.
    """
    model = model_service.get_model()
    processed = preprocess_transactions(features_df, model_service)
    probabilities = model.predict_proba(processed)[:, 1]
    return probabilities