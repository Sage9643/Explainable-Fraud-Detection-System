from __future__ import annotations

from pydantic import BaseModel


class HistoryRecord(BaseModel):
    id: int
    timestamp: str
    prediction: str
    fraud_probability: float
    risk_band: str
    confidence: float
    recommended_action: str
    model_version: str


class HistoryResponse(BaseModel):
    items: list[HistoryRecord]
    total: int
    page: int
    page_size: int