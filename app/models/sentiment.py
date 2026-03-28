"""Schemas for NLP sentiment analysis."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


class SentimentScore(StrEnum):
    TRES_POSITIF = "tres_positif"
    POSITIF = "positif"
    NEUTRE = "neutre"
    NEGATIF = "negatif"
    TRES_NEGATIF = "tres_negatif"


class ZoneSentiment(BaseModel):
    city: str
    zone: str
    mood_score: float = Field(ge=0, le=100)
    sentiment: SentimentScore
    trend: Literal["improving", "stable", "degrading"]
    top_topics: list[str] = Field(default_factory=list)
    sample_count: int = 0
    computed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    valid_until: datetime = Field(default_factory=lambda: datetime.now(UTC))
