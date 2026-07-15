"""
Dashboard endpoint.

Thin controller - delegates entirely to dashboard_service. No ML/DB logic
lives here.
"""
from __future__ import annotations


from fastapi import APIRouter

from schemas.dashboard import DashboardResponse
from services.dashboard_service import get_dashboard_stats
from services.model_service import model_service

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard() -> DashboardResponse:
    return get_dashboard_stats(model_service)