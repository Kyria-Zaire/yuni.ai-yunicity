"""Multi-city registry with dynamic configuration."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.city import CityConfig

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("city_registry")

REGISTRY_KEY = "city:registry:v1"
CITY_TTL = 60 * 60 * 24 * 30  # 30 days

REIMS_CONFIG = CityConfig(
    city_id="reims",
    display_name="Reims",
    center_lat=49.2583,
    center_lng=4.0317,
    zones=[
        "centre", "clairmarais", "croix-rouge",
        "wilson", "laon-zola", "europe", "orgeval",
    ],
    yunicity_api_url="https://api.yunicity.fr",
    yunicity_service_token_key="YUNICITY_SERVICE_TOKEN",
    mistral_context=(
        "Reims est une ville champenoise de 180 000 habitants dans "
        "la Marne. Connue pour sa cathedrale gothique, son champagne "
        "et sa vie associative dynamique."
    ),
    rollout_percentage=100,
)

TROYES_CONFIG = CityConfig(
    city_id="troyes",
    display_name="Troyes",
    center_lat=48.2973,
    center_lng=4.0744,
    zones=["centre", "saint-martin", "chartreux", "bouchon"],
    mistral_context=(
        "Troyes est une ville de l'Aube de 62 000 habitants, "
        "connue pour ses maisons a colombages et ses magasins d'usine."
    ),
    rollout_percentage=10,
)

CHALONS_CONFIG = CityConfig(
    city_id="chalons-en-champagne",
    display_name="Chalons-en-Champagne",
    center_lat=48.9566,
    center_lng=4.3630,
    zones=["centre", "croix-dampierre", "rive-gauche"],
    mistral_context=(
        "Chalons-en-Champagne est la prefecture de la Marne, "
        "45 000 habitants, riche en patrimoine et espaces verts."
    ),
    rollout_percentage=10,
)

DEFAULT_CITIES: dict[str, CityConfig] = {
    "reims": REIMS_CONFIG,
    "troyes": TROYES_CONFIG,
    "chalons-en-champagne": CHALONS_CONFIG,
}


class CityRegistryService:
    """Manages city configurations with Redis persistence."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def get_city(self, city_id: str) -> CityConfig | None:
        raw = await self._redis.get(f"city:v1:{city_id}")
        if raw:
            return CityConfig.model_validate_json(raw)
        return DEFAULT_CITIES.get(city_id)

    async def register_city(self, config: CityConfig) -> None:
        await self._redis.set(
            f"city:v1:{config.city_id}",
            config.model_dump_json(),
            ttl_seconds=CITY_TTL,
        )
        cities = await self.list_cities()
        city_ids = [c.city_id for c in cities]
        if config.city_id not in city_ids:
            city_ids.append(config.city_id)
        await self._redis.set(REGISTRY_KEY, json.dumps(city_ids), ttl_seconds=CITY_TTL)
        logger.info(
            "city_registered",
            city_id=config.city_id,
            display_name=config.display_name,
        )

    async def list_cities(self) -> list[CityConfig]:
        raw = await self._redis.get(REGISTRY_KEY)
        if not raw:
            return [c for c in DEFAULT_CITIES.values() if c.active]
        city_ids: list[str] = json.loads(raw)
        cities: list[CityConfig] = []
        for cid in city_ids:
            cfg = await self.get_city(cid)
            if cfg and cfg.active:
                cities.append(cfg)
        return cities

    async def is_feature_enabled(self, city_id: str, feature: str) -> bool:
        config = await self.get_city(city_id)
        if not config:
            return False
        return config.features.get(feature, False)
