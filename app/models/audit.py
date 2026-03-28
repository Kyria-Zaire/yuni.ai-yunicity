"""Schemas for civic blackbox audit trail — EU AI Act compliance."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field


class AIDecisionType(StrEnum):
    RECOMMENDATION = "recommendation"
    VITALITY_SCORE = "vitality_score"
    SENTIMENT_ANALYSIS = "sentiment"
    QUEST_GENERATION = "quest_generation"
    AGENT_ACTION = "agent_action"
    CHAT_RESPONSE = "chat_response"
    CONTENT_GENERATION = "content_generation"


class AIDecisionRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))

    decision_type: AIDecisionType
    model_used: str
    source: str

    city: str
    zone: str | None = None
    user_hash: str | None = None
    language: str = "fr"

    latency_ms: int
    tokens_input: int = 0
    tokens_output: int = 0
    cache_hit: bool = False

    decision_summary: str
    factors: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)

    checksum: str = ""
    previous_record_id: str | None = None


class AuditChain(BaseModel):
    city: str
    records_count: int
    chain_valid: bool
    oldest_record: datetime
    newest_record: datetime
    integrity_hash: str
