"""
Analytics endpoint.

Thin controller: delegates entirely to analytics_service. No metadata
parsing or reshaping logic lives here.
"""
from __future__ import annotations

from fastapi import APIRouter

from schemas.analytics import AnalyticsResponse
from services.analytics_service import get_analytics
from services.model_service import model_service

router = APIRouter(tags=["analytics"])


@router.get("/api/analytics", response_model=AnalyticsResponse)
def get_model_analytics() -> AnalyticsResponse:
    return get_analytics(model_service)