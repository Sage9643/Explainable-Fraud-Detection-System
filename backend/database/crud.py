"""
Raw persistence functions for prediction_history.

sqlite3-only, no ORM. Deliberately contains no business logic (no risk
banding, no confidence math) - that lives in services/history_service.py.
This module only knows how to read and write rows.
"""
from __future__ import annotations

import json
import sqlite3
from typing import Any


def create_prediction_record(
    conn: sqlite3.Connection,
    *,
    timestamp: str,
    prediction: str,
    fraud_probability: float,
    risk_band: str,
    confidence: float,
    recommended_action: str,
    model_version: str,
    features: dict[str, Any],
) -> int:
    cursor = conn.execute(
        """
        INSERT INTO prediction_history
            (timestamp, prediction, fraud_probability, risk_band, confidence,
             recommended_action, model_version, features_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            timestamp,
            prediction,
            fraud_probability,
            risk_band,
            confidence,
            recommended_action,
            model_version,
            json.dumps(features),
        ),
    )
    conn.commit()
    return cursor.lastrowid


def list_predictions(
    conn: sqlite3.Connection,
    *,
    page: int,
    page_size: int,
    risk_band: str | None = None,
    search: str | None = None,
) -> tuple[list[sqlite3.Row], int]:
    """Returns paginated rows, latest first, and the total matching count.
    features_json is deliberately excluded from the SELECT - the list
    endpoint never exposes raw transaction features."""
    where_clauses: list[str] = []
    params: list[Any] = []

    if risk_band:
        where_clauses.append("risk_band = ?")
        params.append(risk_band)

    if search:
        where_clauses.append("prediction LIKE ?")
        params.append(f"%{search}%")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    total_row = conn.execute(
        f"SELECT COUNT(*) AS total FROM prediction_history {where_sql}", params
    ).fetchone()
    total = total_row["total"]

    offset = (page - 1) * page_size
    rows = conn.execute(
        f"""
        SELECT id, timestamp, prediction, fraud_probability, risk_band,
               confidence, recommended_action, model_version
        FROM prediction_history
        {where_sql}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
        """,
        (*params, page_size, offset),
    ).fetchall()

    return list(rows), total


def get_dashboard_totals(conn: sqlite3.Connection) -> dict[str, Any]:
    """All-time totals across every prediction ever recorded."""
    row = conn.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN prediction = 'Fraudulent' THEN 1 ELSE 0 END) AS fraud_count,
            AVG(confidence) AS avg_confidence
        FROM prediction_history
        """
    ).fetchone()
    return {
        "total": row["total"] or 0,
        "fraud_count": row["fraud_count"] or 0,
        "avg_confidence": row["avg_confidence"] or 0.0,
    }


def get_dashboard_today(conn: sqlite3.Connection, today_start_iso: str) -> dict[str, int]:
    """Totals restricted to timestamp >= today_start_iso. Uses a plain
    string comparison rather than SQLite's date() functions: every
    timestamp is written in the same UTC ISO-8601 format (see
    history_service.record_prediction), so lexicographic comparison sorts
    identically to chronological comparison - no SQLite date-parsing
    version quirks to worry about."""
    row = conn.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN prediction = 'Fraudulent' THEN 1 ELSE 0 END) AS fraud_count,
            SUM(CASE WHEN risk_band IN ('High', 'Critical') THEN 1 ELSE 0 END) AS high_risk_count
        FROM prediction_history
        WHERE timestamp >= ?
        """,
        (today_start_iso,),
    ).fetchone()
    return {
        "predictions_today": row["total"] or 0,
        "fraud_today": row["fraud_count"] or 0,
        "high_risk_alerts_today": row["high_risk_count"] or 0,
    }


def get_risk_band_counts(conn: sqlite3.Connection) -> dict[str, int]:
    """All-time count per risk band. Bands with zero predictions simply
    won't appear in the result - the caller (dashboard_service) fills in
    zero for any band from metadata.json that's missing here."""
    rows = conn.execute("SELECT risk_band, COUNT(*) AS count FROM prediction_history GROUP BY risk_band").fetchall()
    return {row["risk_band"]: row["count"] for row in rows}


def get_predictions_since(conn: sqlite3.Connection, since_iso: str) -> list[sqlite3.Row]:
    """Raw (timestamp, prediction) rows since a given ISO timestamp. Kept as
    a simple, reusable read rather than a bespoke GROUP-BY-date query -
    day-bucketing is business logic and belongs in dashboard_service, not
    the SQL layer."""
    return conn.execute(
        "SELECT timestamp, prediction FROM prediction_history WHERE timestamp >= ? ORDER BY timestamp ASC",
        (since_iso,),
    ).fetchall()