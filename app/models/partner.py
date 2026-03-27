"""Schemas for partner SDK — API keys and tier management."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field


class PartnerTier(StrEnum):
    SANDBOX = "sandbox"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


TIERS_CONFIG: dict[PartnerTier, dict[str, object]] = {
    PartnerTier.SANDBOX: {"rate_limit": 100, "cities": 1, "price_eur": 0},
    PartnerTier.STARTER: {"rate_limit": 1000, "cities": 1, "price_eur": 99},
    PartnerTier.PRO: {"rate_limit": 10000, "cities": 5, "price_eur": 499},
    PartnerTier.ENTERPRISE: {"rate_limit": None, "cities": None, "price_eur": None},
}


class PartnerConfig(BaseModel):
    partner_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    contact_email: str
    tier: PartnerTier
    api_key_hash: str
    allowed_cities: list[str] = Field(default_factory=list)
    rate_limit_per_hour: int = 100
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_used_at: datetime | None = None
