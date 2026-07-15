from __future__ import annotations

from pydantic import BaseModel


class DashboardTotals(BaseModel):
    total_predictions: int
    fraud_count: int
    fraud_rate: float
    avg_confidence: float


class DashboardToday(BaseModel):
    predictions_today: int
    fraud_today: int
    high_risk_alerts_today: int


class RiskDistributionEntry(BaseModel):
    risk_band: str
    count: int


class PredictionTimeseriesEntry(BaseModel):
    date: str
    predictions: int
    fraud: int


class RecentPrediction(BaseModel):
    timestamp: str
    prediction: str
    fraud_probability: float
    risk_band: str


class DashboardResponse(BaseModel):
    totals: DashboardTotals
    today: DashboardToday
    risk_distribution: list[RiskDistributionEntry]
    predictions_over_time: list[PredictionTimeseriesEntry]
    recent_predictions: list[RecentPrediction]