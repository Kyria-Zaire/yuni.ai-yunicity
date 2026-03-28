"""Seed initial city configurations into Redis."""

from __future__ import annotations

import asyncio
import sys

sys.path.insert(0, ".")

from app.core.config import get_settings
from app.services.city_registry_service import (
    CHALONS_CONFIG,
    REIMS_CONFIG,
    TROYES_CONFIG,
    CityRegistryService,
)
from app.services.redis_service import RedisService


async def main() -> None:
    settings = get_settings()
    redis = RedisService(settings)
    registry = CityRegistryService(redis)

    for config in (REIMS_CONFIG, TROYES_CONFIG, CHALONS_CONFIG):
        await registry.register_city(config)
        print(f"Seeded: {config.display_name} ({config.city_id})")

    cities = await registry.list_cities()
    print(f"\nTotal active cities: {len(cities)}")

    await redis.close()


if __name__ == "__main__":
    asyncio.run(main())
