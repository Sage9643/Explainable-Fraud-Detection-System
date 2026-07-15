"""
Risk service.

Converts a raw fraud probability into a business-facing risk band and
recommended action. All thresholds/actions are read from the frozen
metadata.json risk_bands block - never hardcoded here - so a future model
retrain can change risk banding purely by shipping new artifacts.
"""
from __future__ import annotations

from dataclasses import dataclass

from utils.exceptions import ArtifactLoadError


@dataclass(frozen=True)
class RiskClassification:
    risk_band: str
    recommended_action: str


def classify_risk(probability: float, risk_bands: dict) -> RiskClassification:
    """
    risk_bands is metadata["risk_bands"], expected shape:
      {
        "low_max": float, "medium_max": float, "high_max": float,
        "actions": {"Low": str, "Medium": str, "High": str, "Critical": str}
      }

    Bands are inclusive of their upper bound:
      probability <= low_max               -> Low
      low_max < probability <= medium_max  -> Medium
      medium_max < probability <= high_max -> High
      probability > high_max               -> Critical
    """
    try:
        low_max = risk_bands["low_max"]
        medium_max = risk_bands["medium_max"]
        high_max = risk_bands["high_max"]
        actions = risk_bands["actions"]
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json risk_bands is missing required key: {exc}") from exc

    if probability <= low_max:
        band = "Low"
    elif probability <= medium_max:
        band = "Medium"
    elif probability <= high_max:
        band = "High"
    else:
        band = "Critical"

    try:
        action = actions[band]
    except KeyError as exc:
        raise ArtifactLoadError(f"metadata.json risk_bands.actions is missing entry for '{band}'") from exc

    return RiskClassification(risk_band=band, recommended_action=action)
