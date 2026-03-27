"""Schemas for merchant content generation."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ContentType(StrEnum):
    POST_SOCIAL = "post_social"
    POST_LONG = "post_long"
    PROMOTION = "promotion"
    NEWSLETTER = "newsletter"
    STORY = "story"
    SMS = "sms"
    FLYER_TEXT = "flyer_text"


class MerchantContentRequest(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    business_name: str = Field(..., max_length=200)
    business_type: str = Field(..., max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    content_type: ContentType
    topic: str = Field(..., min_length=5, max_length=500)
    tone: Literal[
        "professionnel", "amical", "promotionnel", "informatif", "urgent"
    ] = "amical"
    include_emoji: bool = True
    language: str = Field(default="fr", pattern=r"^[a-z]{2}$")
    target_audience: str | None = Field(default=None, max_length=200)


class GeneratedContent(BaseModel):
    content_type: ContentType
    text: str
    char_count: int
    suggestions: list[str] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    best_post_time: str | None = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MerchantContentResponse(BaseModel):
    business_name: str
    contents: list[GeneratedContent]
    total_generated: int
