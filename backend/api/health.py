"""
Health endpoint.

Reports whether the model/SHAP/database are loaded and ready. Contains no ML
or DB logic itself - it only reads state that model_service and db.py have
already established at startup.
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Request

from database.db import get_connection
from schemas.health import HealthResponse
from services.model_service import model_service

router = APIRouter(tags=["health"])

_start_time = time.monotonic()


def _format_uptime(seconds: float) -> str:
    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def _check_database() -> bool:
    try:
        conn = get_connection()
        try:
            conn.execute("SELECT 1")
        finally:
            conn.close()
        return True
    except Exception:  # noqa: BLE001
        return False


@router.get("/api/health", response_model=HealthResponse)
def get_health(request: Request) -> HealthResponse:
    model_loaded = model_service.is_loaded
    database_connected = _check_database()

    return HealthResponse(
        status="healthy" if (model_loaded and database_connected) else "degraded",
        model_loaded=model_loaded,
        shap_loaded=model_loaded,  # the explainer is built as part of model_service.load()
        database_connected=database_connected,
        model_name=model_service.get_model_name(),
        model_version=model_service.get_model_version(),
        training_date=model_service.get_training_date(),
        uptime=_format_uptime(time.monotonic() - _start_time),
        request_id=request.state.request_id,
    )