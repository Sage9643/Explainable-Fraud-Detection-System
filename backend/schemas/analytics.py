from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ModelInfo(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    training_date: str
    random_seed: int
    optimization_objective: str
    imbalance_strategy: str
    hyperparameters: dict[str, Any]
    decision_threshold: float


class EvaluationMetrics(BaseModel):
    test_auc: float
    test_avg_precision: float
    test_precision: float
    test_recall: float
    test_f1: float
    test_f2: float


class RiskBandFraudRate(BaseModel):
    risk_band: str
    fraud_rate: float


class ConfusionMatrixData(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ROCCurvePoint(BaseModel):
    fpr: float
    tpr: float
    threshold: float | None


class PRCurvePoint(BaseModel):
    precision: float
    recall: float
    threshold: float | None


class FeatureImportanceEntry(BaseModel):
    feature: str
    importance: float


class FeatureImportance(BaseModel):
    gain: list[FeatureImportanceEntry]
    shap: list[FeatureImportanceEntry]


class DatasetInfo(BaseModel):
    total_rows: int
    fraud_rate_pct: float
    train_rows: int
    test_rows: int


class AnalyticsResponse(BaseModel):
    model_info: ModelInfo
    evaluation_metrics: EvaluationMetrics
    risk_band_fraud_rates: list[RiskBandFraudRate]
    confusion_matrix: ConfusionMatrixData | None
    roc_curve: list[ROCCurvePoint] | None
    pr_curve: list[PRCurvePoint] | None
    feature_importance: FeatureImportance | None
    dataset_info: DatasetInfo