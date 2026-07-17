"""
Raw persistence functions for batch_jobs.

sqlite3-only, no ORM. Stores only lightweight batch metadata (never the
scored rows themselves - those live on disk as a CSV file, see
services/batch_service.py). Kept as a separate module from crud.py so each
table's persistence stays single-responsibility, mirroring how
schemas/history.py and schemas/batch.py are already split.
"""
from __future__ import annotations

import json
import sqlite3


def create_batch_job(
    conn: sqlite3.Connection,
    *,
    batch_id: str,
    created_at: str,
    file_path: str,
    rows_scored: int,
    fraud_count: int,
    fraud_rate: float,
    processing_time_ms: int,
    risk_distribution: list[dict],
) -> None:
    conn.execute(
        """
        INSERT INTO batch_jobs
            (batch_id, created_at, file_path, rows_scored, fraud_count,
             fraud_rate, processing_time_ms, risk_distribution_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            batch_id,
            created_at,
            file_path,
            rows_scored,
            fraud_count,
            fraud_rate,
            processing_time_ms,
            json.dumps(risk_distribution),
        ),
    )
    conn.commit()


def get_batch_job(conn: sqlite3.Connection, batch_id: str) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM batch_jobs WHERE batch_id = ?", (batch_id,)
    ).fetchone()