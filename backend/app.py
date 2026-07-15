"""
FraudLens AI - FastAPI application entrypoint.

Sprint 1 scope: application foundation only.
  - Loads configuration
  - Configures structured logging
  - Registers the request-ID middleware
  - Loads all model artifacts exactly once at startup (model_service)
  - Initializes the database connection (no tables yet)
  - Registers global exception handlers
  - Exposes GET /api/health

No prediction, explainability, or batch routes are registered yet - those
are added in later sprints and simply need `app.include_router(...)` added
below.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.explainability import router as explainability_router
from api.dashboard import router as dashboard_router
from api.health import router as health_router
from api.prediction import router as prediction_router
from database.db import init_db
from services.model_service import model_service
from utils.config import get_settings
from utils.error_handlers import register_exception_handlers
from utils.logger import configure_logging, get_logger
from utils.middleware import RequestIDMiddleware

configure_logging()
logger = get_logger("fraudlens.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (env=%s)", settings.app_name, settings.app_env)

    # Fail fast: if artifacts are missing/inconsistent or the DB is
    # unreachable, the process should not come up looking healthy.
    model_service.load()
    init_db()

    logger.info("Startup complete - ready to serve requests")
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Enterprise Explainable Fraud Intelligence Platform - API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)

    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(prediction_router)
    app.include_router(explainability_router)
    app.include_router(dashboard_router)
    # Future sprints register additional routers here, e.g.:
    # app.include_router(batch_router)
    # app.include_router(analytics_router)
    # app.include_router(history_router)


    return app


app = create_app()