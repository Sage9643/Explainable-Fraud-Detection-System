"""
Analytics service.

Reads model_service.get_metadata() and reshapes it into the API's response
schema. No computation happens here and no test data is touched at runtime -
every number this service returns was computed once, offline, either by the
training notebook or by scripts/generate_analytics_metadata.py, and frozen
into metadata.json. This mirrors dashboard_service.py's precedent: a real
endpoint backed by static data, not a live recomputation.

Curve/matrix/importance fields are optional in metadata.json by design (see
schemas/analytics.py) - older metadata.json files that predate
generate_analytics_metadata.py won't have them, and this service returns
None for those fields rather than failing, so the frontend can render an
empty state instead of erroring.
"""
from __future__ import annotations

from schemas.analytics import (
    AnalyticsResponse,
    ConfusionMatrixData,
    DatasetInfo,
    EvaluationMetrics,
    FeatureImportance,
    FeatureImportanceEntry,
    ModelInfo,
    PRCurvePoint,
    RiskBandFraudRate,
    ROCCurvePoint,
)
from services.model_service import ModelService
from utils.exceptions import ArtifactLoadError


def _build_model_info(metadata: dict) -> ModelInfo:
    try:
        return ModelInfo(
            model_name=metadata["model_name"],
            model_version=metadata["model_version"],
            algorithm=metadata["algorithm"],
            training_date=metadata["training_date_utc"],
            random_seed=metadata["random_seed"],
            optimization_objective=metadata["optimization_objective"],
            imbalance_strategy=metadata["imbalance_strategy"],
            hyperparameters=metadata["hyperparameters"],
            decision_threshold=metadata["decision_threshold"],
        )
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json is missing required key: {exc}") from exc


def _build_evaluation_metrics(metadata: dict) -> EvaluationMetrics:
    try:
        metrics = metadata["evaluation_metrics"]
        return EvaluationMetrics(
            test_auc=metrics["test_auc"],
            test_avg_precision=metrics["test_avg_precision"],
            test_precision=metrics["test_precision"],
            test_recall=metrics["test_recall"],
            test_f1=metrics["test_f1"],
            test_f2=metrics["test_f2"],
        )
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json is missing required evaluation metric: {exc}") from exc


def _build_risk_band_fraud_rates(metadata: dict) -> list[RiskBandFraudRate]:
    try:
        fraud_rates = metadata["evaluation_metrics"]["risk_band_fraud_rates"]
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json is missing risk_band_fraud_rates: {exc}") from exc

    # Order follows risk_bands.actions (Low -> Medium -> High -> Critical),
    # the same source of truth risk_service.py and dashboard_service.py use
    # for band ordering - never hardcoded here.
    band_order = list(metadata["risk_bands"]["actions"].keys())
    return [
        RiskBandFraudRate(risk_band=band, fraud_rate=fraud_rates[band])
        for band in band_order
        if band in fraud_rates
    ]


def _build_confusion_matrix(metadata: dict) -> ConfusionMatrixData | None:
    raw = metadata.get("confusion_matrix")
    if raw is None:
        return None
    return ConfusionMatrixData(
        true_negative=raw["true_negative"],
        false_positive=raw["false_positive"],
        false_negative=raw["false_negative"],
        true_positive=raw["true_positive"],
    )


def _build_roc_curve(metadata: dict) -> list[ROCCurvePoint] | None:
    raw = metadata.get("roc_curve")
    if raw is None:
        return None
    return [ROCCurvePoint(fpr=point["fpr"], tpr=point["tpr"], threshold=point.get("threshold")) for point in raw]


def _build_pr_curve(metadata: dict) -> list[PRCurvePoint] | None:
    raw = metadata.get("pr_curve")
    if raw is None:
        return None
    return [
        PRCurvePoint(precision=point["precision"], recall=point["recall"], threshold=point.get("threshold"))
        for point in raw
    ]


def _build_feature_importance(metadata: dict) -> FeatureImportance | None:
    raw = metadata.get("feature_importance")
    if raw is None:
        return None

    def _entries(items: list[dict]) -> list[FeatureImportanceEntry]:
        return [FeatureImportanceEntry(feature=item["feature"], importance=item["importance"]) for item in items]

    return FeatureImportance(
        gain=_entries(raw.get("gain", [])),
        shap=_entries(raw.get("shap", [])),
    )


def _build_dataset_info(metadata: dict) -> DatasetInfo:
    try:
        dataset = metadata["dataset"]
        return DatasetInfo(
            total_rows=dataset["total_rows"],
            fraud_rate_pct=dataset["fraud_rate_pct"],
            train_rows=dataset["train_rows"],
            test_rows=dataset["test_rows"],
        )
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json is missing required dataset key: {exc}") from exc


def get_analytics(model_service: ModelService) -> AnalyticsResponse:
    metadata = model_service.get_metadata()

    return AnalyticsResponse(
        model_info=_build_model_info(metadata),
        evaluation_metrics=_build_evaluation_metrics(metadata),
        risk_band_fraud_rates=_build_risk_band_fraud_rates(metadata),
        confusion_matrix=_build_confusion_matrix(metadata),
        roc_curve=_build_roc_curve(metadata),
        pr_curve=_build_pr_curve(metadata),
        feature_importance=_build_feature_importance(metadata),
        dataset_info=_build_dataset_info(metadata),
    )