"""
Database connection setup.

Uses Python's built-in sqlite3 module directly - no ORM. Initializes the
connection helper, confirms connectivity, and ensures the prediction_history
table exists (idempotent - CREATE TABLE IF NOT EXISTS). No migration tool is
introduced at this project's scale; schema changes are additive and applied
here directly.
"""
from __future__ import annotations

import sqlite3

from utils.config import get_settings
from utils.exceptions import DatabaseNotAvailableError
from utils.logger import get_logger

logger = get_logger(__name__)

settings = get_settings()


def _resolve_db_path(database_url: str) -> str:
    """Converts a sqlite:/// URL (as used in .env for consistency with other
    config values) into a plain filesystem path for sqlite3.connect()."""
    prefix = "sqlite:///"
    if database_url.startswith(prefix):
        return database_url[len(prefix):]
    return database_url


DB_PATH = _resolve_db_path(settings.database_url)

CREATE_PREDICTION_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS prediction_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    prediction TEXT NOT NULL,
    fraud_probability REAL NOT NULL,
    risk_band TEXT NOT NULL,
    confidence REAL NOT NULL,
    recommended_action TEXT NOT NULL,
    model_version TEXT NOT NULL,
    features_json TEXT NOT NULL
);
"""

CREATE_BATCH_JOBS_TABLE = """
CREATE TABLE IF NOT EXISTS batch_jobs (
    batch_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    file_path TEXT NOT NULL,
    rows_scored INTEGER NOT NULL,
    fraud_count INTEGER NOT NULL,
    fraud_rate REAL NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    risk_distribution_json TEXT NOT NULL
);
"""

CREATE_INDEXES = (
    "CREATE INDEX IF NOT EXISTS ix_prediction_history_timestamp ON prediction_history (timestamp);",
    "CREATE INDEX IF NOT EXISTS ix_prediction_history_risk_band ON prediction_history (risk_band);",
    "CREATE INDEX IF NOT EXISTS ix_batch_jobs_created_at ON batch_jobs (created_at);",
)


def get_connection() -> sqlite3.Connection:
    """Returns a new sqlite3 connection with row access by column name.
    Callers are responsible for closing the connection (use try/finally)."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Verifies the database is reachable and ensures all tables/indexes
    exist. Called once at startup."""
    try:
        conn = get_connection()
        try:
            conn.execute("SELECT 1")
            conn.execute(CREATE_PREDICTION_HISTORY_TABLE)
            conn.execute(CREATE_BATCH_JOBS_TABLE)
            for statement in CREATE_INDEXES:
                conn.execute(statement)
            conn.commit()
        finally:
            conn.close()
        logger.info("Database initialized: %s", DB_PATH)
    except Exception as exc:  # noqa: BLE001
        raise DatabaseNotAvailableError(f"Could not connect to database: {exc}") from exc