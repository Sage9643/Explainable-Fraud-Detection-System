"""
Dashboard service.

Reads real aggregate statistics from prediction_history via database/crud.py.

History note: when this file was first written (Sprint 5), prediction_history
did not exist yet, so it returned honest zero values with a TODO to wire up
real queries once history persistence landed. That persistence layer was
built in Sprint 6 (history_service.record_prediction, called from
api/prediction.py after every successful /api/predict), but this file was
never updated to actually read from it - it kept returning hardcoded zeros
regardless of how much real data existed, which is the root cause of the
Sprint 9.1 bug (Dashboard showing "No predictions yet" while History
correctly showed real predictions - both were always reading the *same*
table, but only history_service ever actually queried it). This file is
now genuinely wired to the database.

Risk band names are read from metadata.json (via model_service) rather than
hardcoded, so the distribution always matches the frozen model's actual bands.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from database import crud
from database.db import get_connection
from schemas.dashboard import (
    DashboardResponse,
    DashboardToday,
    DashboardTotals,
    PredictionTimeseriesEntry,
    RiskDistributionEntry,
)
from services.model_service import ModelService

TIMESERIES_DAYS = 7


def _day_label(day: datetime) -> str:
    return day.strftime("%b %d")


def get_dashboard_stats(model_service: ModelService) -> DashboardResponse:
    metadata = model_service.get_metadata()
    risk_band_names = list(metadata["risk_bands"]["actions"].keys())

    now = datetime.now(timezone.utc)
    today_start_iso = now.strftime("%Y-%m-%dT00:00:00")
    timeseries_start_iso = (now - timedelta(days=TIMESERIES_DAYS - 1)).strftime("%Y-%m-%dT00:00:00")

    conn = get_connection()
    try:
        totals_row = crud.get_dashboard_totals(conn)
        today_row = crud.get_dashboard_today(conn, today_start_iso)
        risk_counts = crud.get_risk_band_counts(conn)
        recent_rows = crud.get_predictions_since(conn, timeseries_start_iso)
    finally:
        conn.close()

    total_predictions = totals_row["total"]
    fraud_count = totals_row["fraud_count"]
    fraud_rate = round(fraud_count / total_predictions, 6) if total_predictions else 0.0
    avg_confidence = round(totals_row["avg_confidence"], 6) if totals_row["avg_confidence"] else 0.0

    totals = DashboardTotals(
        total_predictions=total_predictions,
        fraud_count=fraud_count,
        fraud_rate=fraud_rate,
        avg_confidence=avg_confidence,
    )
    today = DashboardToday(
        predictions_today=today_row["predictions_today"],
        fraud_today=today_row["fraud_today"],
        high_risk_alerts_today=today_row["high_risk_alerts_today"],
    )

    risk_distribution = [
        RiskDistributionEntry(risk_band=band, count=risk_counts.get(band, 0)) for band in risk_band_names
    ]

    # Bucket the last TIMESERIES_DAYS days, always including days with zero
    # predictions so the chart shows a continuous axis rather than only the
    # days that happen to have data.
    buckets: dict[str, dict] = {}
    for offset in range(TIMESERIES_DAYS):
        day = now - timedelta(days=TIMESERIES_DAYS - 1 - offset)
        buckets[day.strftime("%Y-%m-%d")] = {"label": _day_label(day), "predictions": 0, "fraud": 0}

    for row in recent_rows:
        day_key = row["timestamp"][:10]
        bucket = buckets.get(day_key)
        if bucket is not None:
            bucket["predictions"] += 1
            if row["prediction"] == "Fraudulent":
                bucket["fraud"] += 1

    predictions_over_time = [
        PredictionTimeseriesEntry(date=bucket["label"], predictions=bucket["predictions"], fraud=bucket["fraud"])
        for bucket in buckets.values()
    ]

    return DashboardResponse(
        totals=totals,
        today=today,
        risk_distribution=risk_distribution,
        predictions_over_time=predictions_over_time,
        recent_predictions=[],
    )