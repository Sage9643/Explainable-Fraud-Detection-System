"""
Database connection setup.

Sprint 1 scope: initialize the SQLAlchemy engine and confirm connectivity
only. The prediction_history table is intentionally NOT created here - that
belongs to the sprint that implements history persistence.
"""
from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from utils.config import get_settings
from utils.exceptions import DatabaseNotAvailableError
from utils.logger import get_logger

logger = get_logger(__name__)

settings = get_settings()

# check_same_thread=False is required for SQLite when the connection is
# shared across FastAPI's async request handlers.
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Verifies the database is reachable. Called once at startup."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database initialized: %s", settings.database_url)
    except Exception as exc:  # noqa: BLE001
        raise DatabaseNotAvailableError(f"Could not connect to database: {exc}") from exc


def get_db():
    """FastAPI dependency that yields a scoped DB session per request.
    Not used by any route yet in Sprint 1 - provided so future sprints can
    depend on it without touching this file again."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
