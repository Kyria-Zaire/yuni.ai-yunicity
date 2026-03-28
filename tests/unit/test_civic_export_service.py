"""Unit tests for CivicDataExportService — ODBL protocol."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.city import CityConfig
from app.services.civic_export_service import ROUNDING_PRECISION, CivicDataExportService


def _make_config() -> CityConfig:
    return CityConfig(
        city_id="reims",
        display_name="Reims",
        center_lat=49.2583,
        center_lng=4.0317,
        zones=["centre", "nord", "sud"],
        rollout_percentage=100,
    )


def _make_service(config: CityConfig | None = None) -> CivicDataExportService:
    registry = MagicMock()
    registry.get_city = AsyncMock(return_value=config or _make_config())
    sentiment = MagicMock()
    sentiment.get_cached = AsyncMock(return_value=None)
    return CivicDataExportService(
        city_registry=registry,
        sentiment_svc=sentiment,
    )


class TestExport:
    @pytest.mark.asyncio
    async def test_export_includes_license_odbl(self) -> None:
        svc = _make_service()
        export = await svc.generate_export("reims")
        assert export.license == "ODbL-1.0"
        assert "odbl" in export.license_url

    @pytest.mark.asyncio
    async def test_export_rounds_citizen_counts_to_100(self) -> None:
        from app.core.metrics import metrics
        original = metrics.eligible_requests
        metrics.eligible_requests = 1234
        metrics.not_eligible_requests = 56
        svc = _make_service()
        export = await svc.generate_export("reims")
        assert export.engagement_stats.total_active_citizens % ROUNDING_PRECISION == 0
        metrics.eligible_requests = original
        metrics.not_eligible_requests = 0

    @pytest.mark.asyncio
    async def test_export_format_json_valid(self) -> None:
        svc = _make_service()
        export = await svc.generate_export("reims")
        json_str = export.model_dump_json()
        assert len(json_str) > 0

    @pytest.mark.asyncio
    async def test_export_no_individual_data_present(self) -> None:
        svc = _make_service()
        export = await svc.generate_export("reims")
        json_str = export.model_dump_json()
        assert "user_id" not in json_str
        assert "email" not in json_str
        assert "phone" not in json_str

    @pytest.mark.asyncio
    async def test_export_zones_match_config(self) -> None:
        svc = _make_service()
        export = await svc.generate_export("reims")
        assert len(export.zones_vitality) == 3
        zone_names = [z.zone_name for z in export.zones_vitality]
        assert "centre" in zone_names

    @pytest.mark.asyncio
    async def test_bbox_less_precise_than_centroid(self) -> None:
        svc = _make_service()
        export = await svc.generate_export("reims")
        if export.zones_vitality:
            bbox = export.zones_vitality[0].bbox
            assert bbox["north"] > bbox["south"]
            assert bbox["east"] > bbox["west"]


class TestMetadata:
    @pytest.mark.asyncio
    async def test_metadata_is_public(self) -> None:
        svc = _make_service()
        meta = await svc.get_metadata("reims")
        assert "license" in meta
        assert meta["conformsTo"] == "DCAT-AP 2.1"

    @pytest.mark.asyncio
    async def test_export_raises_for_unknown_city(self) -> None:
        registry = MagicMock()
        registry.get_city = AsyncMock(return_value=None)
        svc = CivicDataExportService(city_registry=registry)
        with pytest.raises(ValueError, match="Ville inconnue"):
            await svc.generate_export("atlantis")
