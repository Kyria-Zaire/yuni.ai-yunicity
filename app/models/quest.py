"""Schemas for AI-generated urban quests."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.recommend import GeoInput


class QuestDifficulty(StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EPIC = "epic"


class QuestCategory(StrEnum):
    EXPLORATION = "exploration"
    SOCIAL = "social"
    CULTURE = "culture"
    SPORT = "sport"
    CIVIC = "civic"
    FOOD = "food"
    NATURE = "nature"


class QuestStep(BaseModel):
    order: int
    description: str
    geo: GeoInput | None = None
    actor_id: str | None = None
    validation_hint: str


class Quest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    city: str
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    category: QuestCategory
    difficulty: QuestDifficulty
    xp_reward: int
    estimated_duration: str
    steps: list[QuestStep]
    interests_match: list[str] = Field(default_factory=list)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class UserQuestProgress(BaseModel):
    quest_id: str
    user_id_hash: str
    status: Literal["available", "in_progress", "completed", "expired"] = (
        "available"
    )
    current_step: int = 0
    started_at: datetime | None = None
    completed_at: datetime | None = None
