"""Shared response schemas used across all endpoints."""

from datetime import UTC, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ProblemDetail(BaseModel):
    """RFC 7807 Problem Details response."""

    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str = ""


class ResponseMeta(BaseModel):
    """Metadata included in every API response."""

    request_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    source: str = "yuni-ai"
    latency_ms: float | None = None


class APIResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""

    data: T
    meta: ResponseMeta
