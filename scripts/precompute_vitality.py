"""Pre-compute vitality index for all Reims zones.

Intended to run nightly (3:00 AM) via Railway cron.
Usage: python scripts/precompute_vitality.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import CacheTTL, get_settings
from app.core.dependencies import get_yunicity_service
from app.core.logging import configure_logging, get_logger
from app.services.redis_service import RedisService
from app.services.vitality_service import VitalityIndexService

logger = get_logger("precompute_vitality")

ZONES_REIMS = [
    "centre", "clairmarais", "croix-rouge",
    "wilson", "laon-zola", "europe", "orgeval",
]


async def main() -> None:
    settings = get_settings()
    configure_logging(level=settings.LOG_LEVEL, is_dev=settings.is_dev)

    redis = RedisService(settings)
    vitality = VitalityIndexService(redis)
    yunicity = get_yunicity_service(settings)

    for zone in ZONES_REIMS:
        try:
            data = await yunicity.get_vitality_data("reims", zone)
            cache_key = f"vitality:v1:reims:{zone}"

            old_cached = await redis.get(cache_key)
            if old_cached:
                from app.models.vitality import VitalityIndex
                old = VitalityIndex.model_validate_json(old_cached)
                prev_key = f"vitality:prev:reims:{zone}"
                await redis.set(
                    prev_key, str(old.score), CacheTTL.CITY_VITALITY,
                )

            index = await vitality.compute("reims", zone, data)
            await redis.set(
                cache_key,
                index.model_dump_json(),
                ttl_seconds=CacheTTL.CITY_VITALITY,
            )
            logger.info(
                "vitality_precomputed",
                zone=zone,
                score=index.score,
                grade=index.grade,
            )
        except Exception as exc:
            logger.error(
                "vitality_precompute_failed",
                zone=zone,
                error=str(exc),
            )

    await redis.close()


if __name__ == "__main__":
    asyncio.run(main())
