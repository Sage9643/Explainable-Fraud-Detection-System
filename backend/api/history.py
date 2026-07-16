"""
History endpoint.

Thin controller: validates query params, delegates entirely to
history_service. No SQL or business logic lives here.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from schemas.history import HistoryResponse
from services.history_service import get_history
from services.model_service import model_service

router = APIRouter(tags=["history"])


@router.get("/api/history", response_model=HistoryResponse)
def get_prediction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_band: str | None = Query(None, description="Filter by risk band"),
    search: str | None = Query(None, description="Search by prediction label"),
) -> HistoryResponse:
    if risk_band is not None:
        valid_bands = set(model_service.get_metadata()["risk_bands"]["actions"].keys())
        if risk_band not in valid_bands:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid risk_band '{risk_band}'. Must be one of: {sorted(valid_bands)}",
            )

    return get_history(page=page, page_size=page_size, risk_band=risk_band, search=search)