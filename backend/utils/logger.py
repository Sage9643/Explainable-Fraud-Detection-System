"""
Structured logging configuration.

Uses Python's standard logging module with a formatter that includes a
request_id field. Route handlers/middleware attach the request_id via
logging.LoggerAdapter so every log line for a given request can be traced
end to end.
"""
from __future__ import annotations

import logging
import sys

from utils.config import get_settings

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | request_id=%(request_id)s | %(message)s"


class _DefaultRequestIdFilter(logging.Filter):
    """Ensures log records without an explicit request_id (e.g. startup logs)
    still render cleanly instead of raising a KeyError in the formatter."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


def configure_logging() -> None:
    settings = get_settings()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT))
    handler.addFilter(_DefaultRequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(settings.log_level.upper())
    root_logger.handlers = [handler]

    # Quiet down noisy third-party loggers unless we're at DEBUG.
    if settings.log_level.upper() != "DEBUG":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def with_request_id(logger: logging.Logger, request_id: str) -> logging.LoggerAdapter:
    """Wrap a logger so every call automatically includes the given request_id."""
    return logging.LoggerAdapter(logger, {"request_id": request_id})
