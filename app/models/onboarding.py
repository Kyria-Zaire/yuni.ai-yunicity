"""Schemas for newcomer onboarding guide."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class OnboardingStep(BaseModel):
    order: int
    title: str
    description: str
    category: Literal["admin", "logement", "sante", "social", "transport", "culture"]
    action_url: str | None = None
    voice_text: str


class OnboardingGuide(BaseModel):
    city: str
    total_steps: int
    steps: list[OnboardingStep]
    estimated_time_days: int
    local_contacts: list[dict[str, Any]] = Field(default_factory=list)
