"""Schemas for the Vitality Index feature."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class VitalityInputData(BaseModel):
    """Aggregated zone data provided by Yunicity for vitality computation."""

    active_users_30d: int = Field(ge=0)
    event_participation_rate: float = Field(ge=0.0, le=1.0)
    avg_citizen_points: float = Field(ge=0.0)

    posts_count_30d: int = Field(ge=0)
    content_freshness_score: float = Field(ge=0.0, le=1.0)
    content_diversity_score: float = Field(ge=0.0, le=1.0)

    active_actors_count: int = Field(ge=0)
    avg_actor_activity_score: float = Field(ge=0.0, le=10.0)
    actor_category_diversity: float = Field(ge=0.0, le=1.0)

    upcoming_events_30d: int = Field(ge=0)
    avg_event_fill_rate: float = Field(ge=0.0, le=1.0)
    events_per_week: float = Field(ge=0.0)

    active_tribes_count: int = Field(ge=0)
    avg_tribe_activity_rate: float = Field(ge=0.0, le=1.0)
    avg_tribe_activity_score: float = Field(ge=0.0, le=10.0)


class VitalityDimension(BaseModel):
    name: str
    score: float = Field(ge=0.0, le=100.0)
    weight: float = Field(ge=0.0, le=1.0)
    details: dict[str, Any] = Field(default_factory=dict)


class VitalityIndex(BaseModel):
    city: str
    zone: str
    score: float = Field(ge=0.0, le=100.0)
    grade: str
    dimensions: list[VitalityDimension]
    trend: Literal["up", "stable", "down"]
    computed_at: datetime
    valid_until: datetime


class VitalityIndexResponse(BaseModel):
    """Public response schema for the vitality endpoint."""

    city: str
    zone: str
    score: float
    grade: str
    trend: str
    dimensions: list[dict[str, Any]]
    computed_at: datetime
    valid_until: datetime
