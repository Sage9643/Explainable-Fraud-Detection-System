"""
Global exception handlers.

Registered once on the FastAPI app in app.py. Guarantees that no client ever
sees a raw Python traceback: FraudLensError subclasses map to their declared
status code, and anything unexpected is caught and returned as a generic 500
(while the full exception is still logged server-side).
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from utils.exceptions import FraudLensError
from utils.logger import get_logger, with_request_id

logger = get_logger("fraudlens.errors")


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "-")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(FraudLensError)
    async def handle_fraudlens_error(request: Request, exc: FraudLensError) -> JSONResponse:
        request_id = _request_id(request)
        with_request_id(logger, request_id).warning(
            "%s: %s", exc.error_code, exc.message
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.error_code, "detail": exc.message, "request_id": request_id},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = _request_id(request)
        with_request_id(logger, request_id).exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "detail": "An unexpected error occurred. Please try again.",
                "request_id": request_id,
            },
        )
