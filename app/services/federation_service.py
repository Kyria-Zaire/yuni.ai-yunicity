"""EU city federation — peer discovery and comparison."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("federation")


class CityPeer(BaseModel):
    city_id: str
    display_name: str
    country: str
    population_range: str
    vitality_score_avg: float = 0.0
    joined_federation_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
    )
    export_url: str | None = None


class FederationStats(BaseModel):
    total_cities: int
    countries: list[str]
    avg_vitality_score: float
    top_performing_city: str
    benchmark_data: dict[str, float] = Field(default_factory=dict)


EU_CITIES_SEED: list[CityPeer] = [
    CityPeer(
        city_id="reims-fr",
        display_name="Reims",
        country="FR",
        population_range="100k-200k",
        vitality_score_avg=72.5,
        joined_federation_at=datetime(2026, 4, 1, tzinfo=UTC),
        export_url="https://yuni-ai.up.railway.app/v1/civic/export/reims",
    ),
    CityPeer(
        city_id="namur-be",
        display_name="Namur",
        country="BE",
        population_range="100k-200k",
        vitality_score_avg=68.3,
        joined_federation_at=datetime(2026, 10, 1, tzinfo=UTC),
    ),
    CityPeer(
        city_id="freiburg-de",
        display_name="Freiburg",
        country="DE",
        population_range="200k-300k",
        vitality_score_avg=76.1,
        joined_federation_at=datetime(2026, 10, 15, tzinfo=UTC),
    ),
]


class FederationService:
    """Manages EU city federation for civic data sharing."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def _load_peers(self) -> list[CityPeer]:
        raw = await self._redis.get("federation:peers")
        if raw:
            data = json.loads(raw)
            return [CityPeer.model_validate(p) for p in data]
        return list(EU_CITIES_SEED)

    async def _save_peers(self, peers: list[CityPeer]) -> None:
        data = [p.model_dump(mode="json") for p in peers]
        await self._redis.set(
            "federation:peers", json.dumps(data, default=str),
            ttl_seconds=60 * 60 * 24 * 365,
        )

    async def get_peers(
        self,
        city_id: str,
        population_range: str | None = None,
        country: str | None = None,
    ) -> list[CityPeer]:
        all_peers = await self._load_peers()
        peers = [p for p in all_peers if p.city_id != city_id]
        if population_range:
            peers = [p for p in peers if p.population_range == population_range]
        if country:
            peers = [p for p in peers if p.country == country]
        return peers

    async def get_federation_stats(self) -> FederationStats:
        peers = await self._load_peers()
        if not peers:
            return FederationStats(
                total_cities=0, countries=[], avg_vitality_score=0,
                top_performing_city="N/A",
            )
        avg_score = sum(p.vitality_score_avg for p in peers) / len(peers)
        countries = sorted({p.country for p in peers})
        return FederationStats(
            total_cities=len(peers),
            countries=countries,
            avg_vitality_score=round(avg_score, 1),
            top_performing_city="Ville anonymisee",
            benchmark_data={
                "engagement": 71.2,
                "content": 68.5,
                "actors": 74.3,
                "events": 65.8,
                "tribes": 69.1,
            },
        )

    async def compare_with_peers(
        self,
        city_id: str,
        my_score: float,
    ) -> dict[str, Any]:
        peers = await self.get_peers(city_id)
        if not peers:
            return {
                "city_score": my_score, "peer_average": 0,
                "percentile": 100, "delta": 0, "ranking": 1,
            }
        scores = [p.vitality_score_avg for p in peers]
        peer_avg = sum(scores) / len(scores)
        below = sum(1 for s in scores if s < my_score)
        percentile = round((below / len(scores)) * 100, 1)
        all_scores = sorted([*scores, my_score], reverse=True)
        ranking = all_scores.index(my_score) + 1

        return {
            "city_score": my_score,
            "peer_average": round(peer_avg, 1),
            "percentile": percentile,
            "delta": round(my_score - peer_avg, 1),
            "ranking": ranking,
        }

    async def join(self, peer: CityPeer) -> None:
        peers = await self._load_peers()
        peers = [p for p in peers if p.city_id != peer.city_id]
        peers.append(peer)
        await self._save_peers(peers)
        logger.info("federation_city_joined", city=peer.city_id, country=peer.country)
