"""
Model service.

Owns the lifecycle of every frozen ML artifact: model.json (XGBoost native
format), scaler.pkl,
metadata.json, and feature_columns.json, plus the SHAP TreeExplainer built
on top of the loaded model.

Design contract (per the architecture document):
  - Artifacts are loaded exactly ONCE, during application startup.
  - No other module reads these files directly - everything goes through the
    getters exposed here.
  - This module is the only place that imports joblib/shap/xgboost at the
    "load artifact from disk" level, keeping that concern out of api/*.py.

Sprint 1 scope: load, validate, and expose. Prediction/explanation *usage* of
these artifacts is implemented in later sprints.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import shap
from xgboost import XGBClassifier

from utils.config import get_settings
from utils.exceptions import ArtifactLoadError, ModelNotLoadedError
from utils.logger import get_logger

logger = get_logger(__name__)


class ModelService:
    """Singleton-style holder for all loaded ML artifacts.

    A single instance of this class is created and populated during the
    FastAPI startup event (see app.py) and stored on `app.state`. Route
    handlers retrieve it via a dependency rather than importing a module
    level global directly, which keeps the service testable.
    """

    def __init__(self) -> None:
        self._model: Any | None = None
        self._scaler: Any | None = None
        self._metadata: dict[str, Any] | None = None
        self._feature_columns: list[str] | None = None
        self._explainer: shap.TreeExplainer | None = None
        self._loaded: bool = False

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def load(self) -> None:
        """Loads all artifacts from disk and builds the SHAP explainer.

        Raises ArtifactLoadError on any failure - the app is expected to
        fail fast at startup rather than start in a partially-loaded state.
        """
        settings = get_settings()

        self._model = self._load_xgboost_model(settings.model_path)
        logger.info("Model loaded from %s", settings.model_path)

        self._scaler = self._load_pickle(settings.scaler_path, label="scaler")
        logger.info("Scaler loaded from %s", settings.scaler_path)

        self._metadata = self._load_json(settings.metadata_path, label="metadata")
        logger.info(
            "Metadata loaded: model=%s version=%s trained=%s",
            self._metadata.get("model_name"),
            self._metadata.get("model_version"),
            self._metadata.get("training_date_utc"),
        )

        self._feature_columns = self._load_json(settings.feature_columns_path, label="feature_columns")
        logger.info("Feature columns loaded: %d features", len(self._feature_columns))

        self._validate_consistency()

        self._explainer = shap.TreeExplainer(self._model)
        logger.info("SHAP TreeExplainer initialized")

        self._loaded = True

    def _load_xgboost_model(self, path: Path) -> XGBClassifier:
        """Loads the frozen model from XGBoost's native JSON format.

        Deliberately NOT joblib/pickle: pickled XGBoost boosters are tied to
        the exact serialization internals of the xgboost version that wrote
        them, and can raise `XGBoostError: input stream corrupted` when
        unpickled under a different xgboost build. The native `model.json`
        format is version-portable and is XGBoost's own recommended format
        for persisting a trained booster.
        """
        if not path.exists():
            raise ArtifactLoadError(f"Required artifact 'model' not found at {path}")
        try:
            model = XGBClassifier()
            model.load_model(str(path))
            return model
        except Exception as exc:  # noqa: BLE001 - intentionally broad, converted to a domain error
            raise ArtifactLoadError(f"Failed to load 'model' from {path}: {exc}") from exc

    def _load_pickle(self, path: Path, *, label: str) -> Any:
        if not path.exists():
            raise ArtifactLoadError(f"Required artifact '{label}' not found at {path}")
        try:
            return joblib.load(path)
        except Exception as exc:  # noqa: BLE001 - intentionally broad, converted to a domain error
            raise ArtifactLoadError(f"Failed to load '{label}' from {path}: {exc}") from exc

    def _load_json(self, path: Path, *, label: str) -> Any:
        if not path.exists():
            raise ArtifactLoadError(f"Required artifact '{label}' not found at {path}")
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as exc:  # noqa: BLE001
            raise ArtifactLoadError(f"Failed to load '{label}' from {path}: {exc}") from exc

    def _validate_consistency(self) -> None:
        """Cross-checks the loaded artifacts against each other before the
        app is allowed to start serving traffic."""
        metadata_feature_order = self._metadata.get("feature_order")
        if metadata_feature_order is not None and metadata_feature_order != self._feature_columns:
            raise ArtifactLoadError(
                "feature_columns.json does not match metadata.json['feature_order']. "
                "The artifact set is inconsistent."
            )

        expected_count = self._metadata.get("feature_count")
        if expected_count is not None and expected_count != len(self._feature_columns):
            raise ArtifactLoadError(
                f"metadata.json declares feature_count={expected_count} but "
                f"feature_columns.json has {len(self._feature_columns)} entries."
            )

        n_model_features = getattr(self._model, "n_features_in_", None)
        if n_model_features is not None and n_model_features != len(self._feature_columns):
            raise ArtifactLoadError(
                f"Loaded model expects {n_model_features} features but "
                f"feature_columns.json declares {len(self._feature_columns)}."
            )

        if "decision_threshold" not in self._metadata:
            raise ArtifactLoadError("metadata.json is missing required key 'decision_threshold'.")

        if "risk_bands" not in self._metadata:
            raise ArtifactLoadError("metadata.json is missing required key 'risk_bands'.")

    # ------------------------------------------------------------------
    # Getters
    # ------------------------------------------------------------------
    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def get_model(self) -> Any:
        self._ensure_loaded()
        return self._model

    def get_scaler(self) -> Any:
        self._ensure_loaded()
        return self._scaler

    def get_metadata(self) -> dict[str, Any]:
        self._ensure_loaded()
        return self._metadata

    def get_feature_columns(self) -> list[str]:
        self._ensure_loaded()
        return self._feature_columns

    def get_explainer(self) -> shap.TreeExplainer:
        self._ensure_loaded()
        return self._explainer

    def get_model_name(self) -> str | None:
        return self._metadata.get("model_name") if self._metadata else None

    def get_model_version(self) -> str | None:
        return self._metadata.get("model_version") if self._metadata else None

    def get_training_date(self) -> str | None:
        return self._metadata.get("training_date_utc") if self._metadata else None

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            raise ModelNotLoadedError("Model artifacts have not been loaded yet.")


# Module-level singleton. app.py populates this once via .load() during the
# startup event; everything downstream imports `model_service` directly.
model_service = ModelService()
