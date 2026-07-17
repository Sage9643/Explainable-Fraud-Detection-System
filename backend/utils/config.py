"""
Centralized application configuration.

Every environment-dependent value used anywhere in the backend is read through
this module. No other file should call os.getenv() directly, and no file
should hardcode a path, URL, or credential.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "FraudLens AI"
    app_env: str = "development"
    log_level: str = "INFO"

    # --- Model artifacts ---
    model_artifacts_dir: str = "models/artifacts"
    model_filename: str = "model.json"
    scaler_filename: str = "scaler.pkl"
    metadata_filename: str = "metadata.json"
    feature_columns_filename: str = "feature_columns.json"

    # --- Database ---
    database_url: str = "sqlite:///./fraudlens.db"

    # --- CORS ---
    cors_origins: str = "http://localhost:5173"

    # --- Batch prediction ---
    max_batch_rows: int = 5_000_000
    max_upload_size_mb: int = 1400
    batch_output_dir: str = "generated/batch_results"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def model_artifacts_path(self) -> Path:
        return Path(self.model_artifacts_dir)

    @property
    def model_path(self) -> Path:
        return self.model_artifacts_path / self.model_filename

    @property
    def scaler_path(self) -> Path:
        return self.model_artifacts_path / self.scaler_filename

    @property
    def metadata_path(self) -> Path:
        return self.model_artifacts_path / self.metadata_filename

    @property
    def feature_columns_path(self) -> Path:
        return self.model_artifacts_path / self.feature_columns_filename

    @property
    def batch_output_path(self) -> Path:
        return Path(self.batch_output_dir)

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Settings are read from the environment exactly once and cached for the
    lifetime of the process."""
    return Settings()