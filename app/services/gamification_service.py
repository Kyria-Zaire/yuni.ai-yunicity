"""XP gamification service with badges and levels."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.gamification import (
    BADGES_MAP,
    LEVEL_THRESHOLDS,
    XP_VALUES,
    CitizenLevel,
    UserXPProfile,
    XPAction,
    XPEvent,
)

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("gamification")

XP_PROFILE_TTL = 60 * 60 * 24 * 90  # 90 days


class GamificationService:
    """Awards XP, manages badges and citizen levels."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def award_xp(
        self,
        user_id_hash: str,
        action: XPAction,
        city: str,
    ) -> XPEvent:
        xp_earned = XP_VALUES[action]
        profile = await self._get_or_create_profile(user_id_hash)
        old_level = profile.level

        profile.total_xp += xp_earned
        profile.level = self._compute_level(profile.total_xp)

        new_badges = self._check_badges(profile, action)
        for badge_id in new_badges:
            profile.badges.append(badge_id)
            badge = BADGES_MAP.get(badge_id)
            if badge:
                profile.total_xp += badge.xp_reward

        profile.level = self._compute_level(profile.total_xp)
        profile.next_level_xp = self._xp_to_next_level(profile.total_xp)

        profile.xp_history.append({
            "action": action.value,
            "xp": xp_earned,
            "ts": datetime.now(UTC).isoformat(),
        })
        profile.xp_history = profile.xp_history[-10:]

        await self._save_profile(user_id_hash, profile)

        level_changed = profile.level != old_level
        logger.info(
            "xp_awarded",
            action=action.value,
            xp_earned=xp_earned,
            city=city,
            level_changed=level_changed,
            badges_count=len(new_badges),
        )

        return XPEvent(
            action=action,
            xp_earned=xp_earned,
            new_total=profile.total_xp,
            new_level=profile.level if level_changed else None,
            badges_unlocked=new_badges,
        )

    async def get_profile(self, user_id_hash: str) -> UserXPProfile:
        return await self._get_or_create_profile(user_id_hash)

    @staticmethod
    def _compute_level(total_xp: int) -> CitizenLevel:
        level = CitizenLevel.VISITEUR
        for lvl, threshold in sorted(
            LEVEL_THRESHOLDS.items(), key=lambda x: x[1], reverse=True,
        ):
            if total_xp >= threshold:
                return lvl
        return level

    @staticmethod
    def _xp_to_next_level(total_xp: int) -> int:
        for _lvl, threshold in sorted(
            LEVEL_THRESHOLDS.items(), key=lambda x: x[1],
        ):
            if threshold > total_xp:
                return threshold - total_xp
        return 0

    @staticmethod
    def _check_badges(profile: UserXPProfile, action: XPAction) -> list[str]:
        new_badges: list[str] = []
        existing = set(profile.badges)

        if action == XPAction.RECOMMENDATION_USED and "first_recommendation" not in existing:
            new_badges.append("first_recommendation")
        if action == XPAction.VOICE_COMMAND and "voice_pioneer" not in existing:
            new_badges.append("voice_pioneer")
        if action == XPAction.CITIZEN_REPORT and "first_report" not in existing:
            new_badges.append("first_report")
        if action == XPAction.CHAT_MESSAGE and "first_chat" not in existing:
            new_badges.append("first_chat")
        if action == XPAction.MERCHANT_CONTENT and "merchant_friend" not in existing:
            new_badges.append("merchant_friend")

        xp = profile.total_xp
        if xp >= 5000 and "social_butterfly" not in existing:
            new_badges.append("social_butterfly")
        if xp >= 1500 and "level_acteur" not in existing:
            new_badges.append("level_acteur")
        if xp >= 500 and "level_citoyen" not in existing:
            new_badges.append("level_citoyen")

        return new_badges

    async def _get_or_create_profile(self, user_id_hash: str) -> UserXPProfile:
        key = _xp_key(user_id_hash)
        raw = await self._redis.get(key)
        if raw:
            return UserXPProfile.model_validate_json(raw)
        return UserXPProfile(
            user_id_hash=user_id_hash,
            next_level_xp=LEVEL_THRESHOLDS[CitizenLevel.HABITANT],
        )

    async def _save_profile(self, user_id_hash: str, profile: UserXPProfile) -> None:
        key = _xp_key(user_id_hash)
        await self._redis.set(key, profile.model_dump_json(), ttl_seconds=XP_PROFILE_TTL)


def _xp_key(user_id_hash: str) -> str:
    return f"xp:v1:{hashlib.sha256(user_id_hash.encode()).hexdigest()[:16]}"
