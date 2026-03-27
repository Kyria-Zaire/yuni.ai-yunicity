"""Schemas for multi-city configuration."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CityConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city_id: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z\-]+$")
    display_name: str
    country: str = "FR"
    language: str = "fr"

    center_lat: float
    center_lng: float
    zones: list[str]
    radius_km: float = 10.0

    yunicity_api_url: str = ""
    yunicity_service_token_key: str = "YUNICITY_SERVICE_TOKEN"

    mistral_context: str = ""

    features: dict[str, bool] = Field(default_factory=lambda: {
        "recommendations": True,
        "chat": True,
        "voice": True,
        "vitality": True,
        "quests": True,
        "merchant": True,
        "reports": True,
        "dashboard": True,
    })

    rollout_percentage: int = Field(default=10, ge=0, le=100)
    active: bool = True

    onboarding_steps: list[str] = Field(default_factory=list)
    local_contacts: list[dict[str, Any]] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CityListResponse(BaseModel):
    cities: list[CityConfig]
    total: int
