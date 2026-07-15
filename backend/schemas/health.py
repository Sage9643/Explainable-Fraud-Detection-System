from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    model_loaded: bool
    shap_loaded: bool
    database_connected: bool
    model_name: str | None = None
    model_version: str | None = None
    training_date: str | None = None
    uptime: str
    request_id: str


class ErrorResponse(BaseModel):
    error: str
    detail: str
    request_id: str
