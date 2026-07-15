
from __future__ import annotations

from schemas.dashboard import (
    DashboardResponse,
    DashboardToday,
    DashboardTotals,
    PredictionTimeseriesEntry,
    RiskDistributionEntry,
)
from services.model_service import ModelService


def get_dashboard_stats(model_service: ModelService) -> DashboardResponse:
    metadata = model_service.get_metadata()
    risk_band_names = list(metadata["risk_bands"]["actions"].keys())

    # TODO(Sprint 9): replace with real aggregate queries against
    # prediction_history, e.g. crud.count_predictions(), crud.fraud_rate(),
    # crud.risk_band_counts(), crud.predictions_by_day(), crud.recent(limit=10).
    totals = DashboardTotals(
        total_predictions=0,
        fraud_count=0,
        fraud_rate=0.0,
        avg_confidence=0.0,
    )
    today = DashboardToday(
        predictions_today=0,
        fraud_today=0,
        high_risk_alerts_today=0,
    )
    risk_distribution = [RiskDistributionEntry(risk_band=band, count=0) for band in risk_band_names]
    predictions_over_time: list[PredictionTimeseriesEntry] = []
    recent_predictions: list = []

    return DashboardResponse(
        totals=totals,
        today=today,
        risk_distribution=risk_distribution,
        predictions_over_time=predictions_over_time,
        recent_predictions=recent_predictions,
    )