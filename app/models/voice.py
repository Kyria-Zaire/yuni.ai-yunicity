"""Schemas for voice endpoints (STT + TTS)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class STTResult(BaseModel):
    text: str
    language: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_silent: bool = False
    duration_seconds: float | None = None


class STTRequest(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    language: str = Field(default="fr", pattern=r"^[a-z]{2}$")
    city: str = Field(..., min_length=2, max_length=100)
    context: Literal["command", "chat", "report"] = "command"


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: float
    context: str
    processing_ms: int


class TTSSynthesizeRequest(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    text: str = Field(..., min_length=1, max_length=3000)
    voice_id: str = Field(default="Lea", max_length=50)


class TTSResult(BaseModel):
    audio_data: bytes
    content_type: str = "audio/mpeg"
    cached: bool = False
    char_count: int = 0

    model_config = ConfigDict(arbitrary_types_allowed=True)
