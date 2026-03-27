"""Deterministic feature flag rollout for progressive user activation."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.logging import get_logger

if TYPE_CHECKING:
    from fastapi import Request

    from app.core.config import Settings

logger = get_logger("rollout")


class RolloutService:
    """Routes a deterministic percentage of users to Yuni AI recommendations."""

    def __init__(self, settings: Settings) -> None:
        self.rollout_percentage: int = settings.ROLLOUT_PERCENTAGE
        self.enabled_cities: list[str] = settings.rollout_cities_list
        self._admin_token: str = settings.ADMIN_BYPASS_TOKEN.get_secret_value()

    def is_eligible(
        self,
        user_id_hash: str,
        city: str,
        request: Request,
    ) -> bool:
        """Check if a user qualifies for AI recommendations.

        Rules applied in order:
        1. Admin bypass header -> always eligible
        2. City not in enabled list -> not eligible
        3. 0% rollout -> nobody eligible
        4. 100% rollout -> everybody eligible
        5. Deterministic hash bucket -> same user always gets same result
        """
        if self._is_admin_bypass(request):
            return True

        if city.lower() not in [c.lower() for c in self.enabled_cities]:
            return False

        if self.rollout_percentage <= 0:
            return False
        if self.rollout_percentage >= 100:
            return True

        bucket = int(user_id_hash[:8], 16) % 100
        return bucket < self.rollout_percentage

    def _is_admin_bypass(self, request: Request) -> bool:
        header_value = request.headers.get("X-Yuni-Admin", "")
        return bool(self._admin_token) and header_value == self._admin_token
