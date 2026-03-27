"""Real HTTP client for the Yunicity platform APIs."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from app.core.logging import get_logger
from app.models.yunicity import MapData, Tribe, UserPassport
from app.services.yunicity_api import YunicityAPIService

if TYPE_CHECKING:
    from app.core.config import Settings

logger = get_logger("yunicity_real")


class RealYunicityHTTPService(YunicityAPIService):
    """Production client — calls the live Yunicity APIs with service token."""

    def __init__(self, settings: Settings, http_client: httpx.AsyncClient) -> None:
        self._base_url = str(settings.YUNICITY_API_BASE_URL).rstrip("/")
        self._service_token = settings.YUNICITY_SERVICE_TOKEN.get_secret_value()
        self._client = http_client
        self._timeout = 5.0

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._service_token}",
            "Content-Type": "application/json",
            "X-Service-Name": "yuni-ai",
        }

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_fixed(0.5),
        retry=retry_if_exception_type(httpx.TimeoutException),
        reraise=True,
    )
    async def get_user_passport(self, user_id_hash: str) -> UserPassport:
        try:
            resp = await self._client.get(
                f"{self._base_url}/users/gamification/passport/{user_id_hash}",
                headers=self._headers(),
                timeout=self._timeout,
            )
            resp.raise_for_status()
            return UserPassport.model_validate(resp.json())
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return self._default_passport(user_id_hash)
            logger.warning("yunicity_passport_error", status=exc.response.status_code)
            return self._default_passport(user_id_hash)
        except Exception as exc:
            logger.warning("yunicity_passport_error", error=str(exc))
            return self._default_passport(user_id_hash)

    async def get_city_tribes(self, city: str) -> list[Tribe]:
        try:
            resp = await self._client.get(
                f"{self._base_url}/community/tribes",
                params={"city": city},
                headers=self._headers(),
                timeout=self._timeout,
            )
            resp.raise_for_status()
            data = resp.json()
            return [Tribe.model_validate(t) for t in data.get("tribes", [])]
        except Exception as exc:
            logger.warning("yunicity_tribes_error", error=str(exc), city=city)
            return []

    async def get_map_data(self, lat: float, lng: float) -> MapData:
        try:
            resp = await self._client.get(
                f"{self._base_url}/map/data",
                params={"lat": lat, "lng": lng},
                headers=self._headers(),
                timeout=self._timeout,
            )
            resp.raise_for_status()
            return MapData.model_validate(resp.json())
        except Exception as exc:
            logger.warning("yunicity_map_error", error=str(exc))
            return MapData(actors=[], tribes=[], events=[], zone="unknown")

    @staticmethod
    def _default_passport(user_id_hash: str) -> UserPassport:
        return UserPassport(
            user_id_hash=user_id_hash,
            points=0,
            level="citoyen",
            badges=[],
            interests=[],
            joined_at=datetime.now(UTC),
        )
