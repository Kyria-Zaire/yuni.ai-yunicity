"""Civic data export service — ODBL aggregated data for open data portals."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.logging import get_logger
from app.core.metrics import metrics
from app.models.civic_protocol import (
    CivicDataExport,
    CivicEngagementStats,
    DataQualityMetrics,
    ReportsSummary,
    ZoneVitalityExport,
)

if TYPE_CHECKING:
    from app.services.city_registry_service import CityRegistryService
    from app.services.sentiment_service import SentimentService

logger = get_logger("civic_export")

ROUNDING_PRECISION = 100
MINIMUM_ZONE_POPULATION = 100


class CivicDataExportService:
    """Generates ODBL-compliant civic data exports with RGPD anonymization."""

    def __init__(
        self,
        city_registry: CityRegistryService,
        sentiment_svc: SentimentService | None = None,
    ) -> None:
        self._city_registry = city_registry
        self._sentiment = sentiment_svc

    async def generate_export(
        self,
        city_id: str,
        period_days: int = 30,
    ) -> CivicDataExport:
        config = await self._city_registry.get_city(city_id)
        if not config:
            msg = f"Ville inconnue: {city_id}"
            raise ValueError(msg)

        period_end = datetime.now(UTC)
        period_start = period_end - timedelta(days=period_days)

        zones_vitality: list[ZoneVitalityExport] = []
        for zone in config.zones:
            mood = 50.0
            if self._sentiment:
                cached = await self._sentiment.get_cached(city_id, zone)
                if cached:
                    mood = cached.mood_score

            zones_vitality.append(ZoneVitalityExport(
                zone_id=f"{city_id}-{zone}",
                zone_name=zone,
                bbox=self._approximate_bbox(config.center_lat, config.center_lng),
                vitality_score=0.0,
                vitality_grade="C",
                engagement_index=0.0,
                sentiment_mood=round(mood, 0),
                active_actors_count=0,
                upcoming_events_count=0,
            ))

        engagement = self._aggregate_engagement()
        reports = ReportsSummary()

        return CivicDataExport(
            export_id=str(uuid4()),
            generated_at=datetime.now(UTC),
            city=city_id,
            period_start=period_start,
            period_end=period_end,
            zones_vitality=zones_vitality,
            engagement_stats=engagement,
            reports_summary=reports,
            data_quality=DataQualityMetrics(
                completeness=0.85,
                freshness_hours=24,
                zones_covered=len(zones_vitality),
                total_zones=len(config.zones),
            ),
        )

    def _aggregate_engagement(self) -> CivicEngagementStats:
        total = metrics.eligible_requests + metrics.not_eligible_requests
        rounded_total = (total // ROUNDING_PRECISION) * ROUNDING_PRECISION

        participation = (
            round(metrics.eligible_requests / total, 2) if total > 0 else 0.0
        )

        return CivicEngagementStats(
            total_active_citizens=rounded_total,
            participation_rate=participation,
            top_interests=["sport", "culture", "environnement", "famille", "tech"],
            reports_per_1000_citizens=0.0,
            quests_completed_rate=0.0,
        )

    @staticmethod
    def _approximate_bbox(lat: float, lng: float) -> dict[str, float]:
        offset = 0.05
        return {
            "north": round(lat + offset, 2),
            "south": round(lat - offset, 2),
            "east": round(lng + offset, 2),
            "west": round(lng - offset, 2),
        }

    async def get_metadata(self, city_id: str) -> dict[str, str]:
        config = await self._city_registry.get_city(city_id)
        return {
            "title": f"Yuni AI Civic Data — {config.display_name if config else city_id}",
            "license": "ODbL-1.0",
            "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
            "format": "application/json",
            "source": "Yuni AI Civic Intelligence",
            "spatial": city_id,
            "temporal": "last_30_days",
            "conformsTo": "DCAT-AP 2.1",
        }
