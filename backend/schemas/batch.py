from __future__ import annotations

from pydantic import BaseModel


class RiskDistributionEntry(BaseModel):
    risk_band: str
    count: int


class BatchPredictResponse(BaseModel):
    batch_id: str
    rows_scored: int
    fraud_count: int
    fraud_rate: float
    processing_time_ms: int
    risk_distribution: list[RiskDistributionEntry]