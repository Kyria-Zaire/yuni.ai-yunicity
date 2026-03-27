"""Schemas for citizen reports."""

from __future__ import annotations

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.recommend import GeoInput


class ReportCategory(StrEnum):
    VOIRIE = "voirie"
    ECLAIRAGE = "eclairage"
    PROPRETE = "proprete"
    SECURITE = "securite"
    INFRASTRUCTURE = "infra"
    NATURE = "nature"
    AUTRE = "autre"


class ReportInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    city: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5, max_length=1000)
    geo: GeoInput | None = None
    category: ReportCategory | None = None
    source: Literal["text", "voice"] = "text"


class ReportOutput(BaseModel):
    report_id: str
    category: ReportCategory
    status: Literal["received", "processing", "forwarded"]
    message: str
    estimated_response: str
