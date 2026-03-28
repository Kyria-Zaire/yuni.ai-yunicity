"""Anonymised local leaderboard service."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Literal

from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.models.gamification import CitizenLevel

if TYPE_CHECKING:
    from app.services.gamification_service import GamificationService
    from app.services.redis_service import RedisService

logger = get_logger("leaderboard")

ADJECTIVES = [
    "Courageux", "Curieux", "Engage", "Solidaire", "Creatif",
    "Dynamique", "Bienveillant", "Actif", "Passionne", "Attentif",
]

CITY_NOUNS: dict[str, list[str]] = {
    "reims": ["Champenois", "Citoyen", "Remois", "Habitant"],
    "troyes": ["Troyen", "Citoyen", "Habitant", "Aubois"],
    "default": ["Citoyen", "Habitant", "Riverain", "Voisin"],
}


def generate_pseudonym(user_id_hash: str, city: str) -> str:
    hash_hex = hashlib.sha256(user_id_hash.encode()).hexdigest()
    seed = int(hash_hex[:8], 16)
    adj = ADJECTIVES[seed % len(ADJECTIVES)]
    nouns = CITY_NOUNS.get(city, CITY_NOUNS["default"])
    noun = nouns[(seed // 10) % len(nouns)]
    number = (seed // 100) % 100
    return f"{adj} {noun} #{number:02d}"


class LeaderboardEntry(BaseModel):
    rank: int
    pseudonym: str
    level: CitizenLevel
    total_xp: int
    badges_count: int
    is_current_user: bool = False


class Leaderboard(BaseModel):
    city: str
    zone: str | None = None
    period: Literal["week", "month", "all_time"]
    entries: list[LeaderboardEntry] = Field(default_factory=list)
    current_user_rank: int | None = None
    total_participants: int = 0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class LeaderboardService:
    """Manages anonymised city leaderboards backed by Redis sorted sets."""

    def __init__(
        self, redis: RedisService, gamification: GamificationService,
    ) -> None:
        self._redis = redis
        self._gamification = gamification

    async def get_leaderboard(
        self,
        city: str,
        period: Literal["week", "month", "all_time"],
        requesting_user_hash: str,
        zone: str | None = None,
    ) -> Leaderboard:
        key = f"leaderboard:{city}:{period}"
        top_raw = await self._redis.get(key)

        entries: list[LeaderboardEntry] = []
        if top_raw:
            import json
            top_data: list[dict[str, Any]] = json.loads(top_raw)
            top_data.sort(key=lambda x: int(x.get("xp", 0)), reverse=True)
            for i, item in enumerate(top_data[:10]):
                uhash = str(item.get("hash", ""))
                xp = int(item.get("xp", 0))
                profile = await self._gamification.get_profile(uhash)
                entries.append(LeaderboardEntry(
                    rank=i + 1,
                    pseudonym=generate_pseudonym(uhash, city),
                    level=profile.level,
                    total_xp=xp,
                    badges_count=len(profile.badges),
                    is_current_user=(uhash == requesting_user_hash),
                ))

        return Leaderboard(
            city=city,
            zone=zone,
            period=period,
            entries=entries,
            current_user_rank=self._find_rank(entries, requesting_user_hash),
            total_participants=len(entries),
            updated_at=datetime.now(UTC),
        )

    async def update_score(
        self, user_id_hash: str, city: str, new_xp_total: int,
    ) -> None:
        import json
        for period in ("week", "month", "all_time"):
            key = f"leaderboard:{city}:{period}"
            raw = await self._redis.get(key)
            data: list[dict[str, Any]] = json.loads(raw) if raw else []

            found = False
            for item in data:
                if item.get("hash") == user_id_hash:
                    item["xp"] = new_xp_total
                    found = True
                    break
            if not found:
                data.append({"hash": user_id_hash, "xp": new_xp_total})

            data.sort(key=lambda x: int(x.get("xp", 0)), reverse=True)
            await self._redis.set(key, json.dumps(data), ttl_seconds=60 * 60 * 24 * 30)

    @staticmethod
    def _find_rank(
        entries: list[LeaderboardEntry], user_hash: str,
    ) -> int | None:
        for entry in entries:
            if entry.is_current_user:
                return entry.rank
        return None
