"""Schemas for semantic search results."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ActorSearchResult(BaseModel):
    """A single actor returned by Qdrant semantic search."""

    actor_id: str
    name: str
    category: str
    semantic_score: float = Field(..., ge=0.0, le=1.0)
    payload: dict[str, Any] = Field(default_factory=dict)


class TribeSearchResult(BaseModel):
    """A single tribe returned by Qdrant semantic search."""

    tribe_id: str
    name: str
    category: str
    members_count: int
    semantic_score: float = Field(..., ge=0.0, le=1.0)
    payload: dict[str, Any] = Field(default_factory=dict)
