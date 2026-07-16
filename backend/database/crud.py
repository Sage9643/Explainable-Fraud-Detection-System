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