"""
Domain-level exceptions.

Routes and services raise these instead of letting raw exceptions (KeyError,
FileNotFoundError, etc.) bubble up to the client. app.py registers a single
handler per exception type so every error the client sees is a clean,
predictable JSON shape - never a stack trace.
"""
from __future__ import annotations


class FraudLensError(Exception):
    """Base class for all application-raised errors."""

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class ModelNotLoadedError(FraudLensError):
    """Raised when a request needs the model/scaler/explainer but startup
    loading has not completed or failed."""

    status_code = 503
    error_code = "model_not_loaded"


class ArtifactLoadError(FraudLensError):
    """Raised when a model artifact is missing, unreadable, or fails
    consistency validation at startup."""

    status_code = 500
    error_code = "artifact_load_error"


class DatabaseNotAvailableError(FraudLensError):
    """Raised when the database connection could not be established."""

    status_code = 503
    error_code = "database_unavailable"


class InvalidTransactionError(FraudLensError):
    """Reserved for the prediction sprint - raised when transaction input
    fails a business-rule check beyond basic Pydantic schema validation."""

    status_code = 400
    error_code = "invalid_transaction"
