"""Pydantic schemas for the recommendation endpoint contract."""

from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.common import APIResponse, ResponseMeta

ALLOWED_INTERESTS = frozenset({
    "sport", "culture", "environnement", "famille", "tech",
    "musique", "art", "gastronomie", "politique", "education",
    "sante", "commerce", "tourisme", "solidarite", "innovation",
})


class GeoInput(BaseModel):
    """Truncated geographic coordinates (~1km precision)."""

    model_config = ConfigDict(strict=True, extra="forbid")

    lat_truncated: float = Field(
        ..., ge=-90.0, le=90.0,
        description="Latitude tronquee a 2 decimales (~1km precision)",
    )
    lng_truncated: float = Field(
        ..., ge=-180.0, le=180.0,
        description="Longitude tronquee a 2 decimales",
    )


class UserInput(BaseModel):
    """Input schema for the recommendation endpoint."""

    model_config = ConfigDict(strict=True, extra="forbid")

    user_id_hash: str = Field(
        ..., min_length=64, max_length=64,
        pattern=r"^[a-f0-9]{64}$",
        description="SHA-256 hash du user_id Yunicity",
    )
    city: str = Field(
        ..., min_length=2, max_length=100,
        description="Nom de la ville",
    )
    interests: list[str] = Field(
        ..., min_length=1, max_length=10,
        description="Liste d'interets de l'utilisateur",
    )
    points: int = Field(..., ge=0, le=1_000_000)
    geo: GeoInput

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: list[str]) -> list[str]:
        for interest in v:
            if interest.lower() not in ALLOWED_INTERESTS:
                msg = f"Interet non reconnu: {interest}"
                raise ValueError(msg)
        return [i.lower() for i in v]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cache_key(self) -> str:
        """Deterministic anonymous Redis cache key."""
        interests_hash = hashlib.md5(  # noqa: S324
            ",".join(sorted(self.interests)).encode(),
        ).hexdigest()[:8]
        points_bucket = self.points // 100
        return (
            f"rec:v1:{self.city}:"
            f"{self.geo.lat_truncated}:{self.geo.lng_truncated}:"
            f"{interests_hash}:{points_bucket}"
        )


class ActorRecommendation(BaseModel):
    id: str
    name: str = Field(..., max_length=200)
    category: str
    distance_km: float | None = None
    reason: str = Field(..., max_length=150)
    score: float = Field(..., ge=0.0, le=1.0)


class TribeRecommendation(BaseModel):
    id: str
    name: str = Field(..., max_length=200)
    category: str
    members_count: int
    reason: str = Field(..., max_length=150)
    score: float = Field(..., ge=0.0, le=1.0)


class EventRecommendation(BaseModel):
    id: str
    title: str = Field(..., max_length=200)
    actor_id: str
    date: datetime
    category: str
    reason: str = Field(..., max_length=150)


class RecommendationOutput(BaseModel):
    """Complete recommendation payload returned to the client."""

    actors: list[ActorRecommendation] = Field(default_factory=list, max_length=3)
    tribes: list[TribeRecommendation] = Field(default_factory=list, max_length=2)
    events: list[EventRecommendation] = Field(default_factory=list, max_length=3)
    reason: str = Field(
        ..., max_length=300,
        description="Explication courte en francais",
    )
    source: Literal["yuni_ai_cache", "yuni_ai_mistral", "yuni_ai_fallback"]

    @field_validator("actors", mode="before")
    @classmethod
    def limit_actors(cls, v: list[object]) -> list[object]:
        return v[:3] if isinstance(v, list) else v

    @field_validator("tribes", mode="before")
    @classmethod
    def limit_tribes(cls, v: list[object]) -> list[object]:
        return v[:2] if isinstance(v, list) else v

    @field_validator("events", mode="before")
    @classmethod
    def limit_events(cls, v: list[object]) -> list[object]:
        return v[:3] if isinstance(v, list) else v


RecommendationRequest = UserInput


class RecommendationResponse(APIResponse[RecommendationOutput]):
    """Typed wrapper for the recommendation endpoint response."""


class NotEligibleResponse(BaseModel):
    """Returned when the user is not in the rollout cohort."""

    eligible: bool = False
    message: str
    meta: ResponseMeta
