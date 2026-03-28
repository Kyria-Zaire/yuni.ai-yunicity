"""Unit tests for CityRegistryService (YAI-036)."""

from __future__ import annotations

import pytest

from app.models.city import CityConfig
from app.services.city_registry_service import CityRegistryService


class _FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int = 0) -> None:
        self._store[key] = value


@pytest.mark.asyncio
async def test_get_reims_returns_default_config() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    config = await svc.get_city("reims")
    assert config is not None
    assert config.city_id == "reims"
    assert config.display_name == "Reims"


@pytest.mark.asyncio
async def test_register_city_persists_in_redis() -> None:
    redis = _FakeRedis()
    svc = CityRegistryService(redis)  # type: ignore[arg-type]
    new_city = CityConfig(
        city_id="lyon",
        display_name="Lyon",
        center_lat=45.7640,
        center_lng=4.8357,
        zones=["presquile", "croix-rousse"],
    )
    await svc.register_city(new_city)
    config = await svc.get_city("lyon")
    assert config is not None
    assert config.display_name == "Lyon"


@pytest.mark.asyncio
async def test_list_cities_returns_active_only() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    cities = await svc.list_cities()
    assert all(c.active for c in cities)
    assert len(cities) >= 1


@pytest.mark.asyncio
async def test_get_unknown_city_returns_none() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    config = await svc.get_city("atlantis")
    assert config is None


@pytest.mark.asyncio
async def test_is_feature_enabled_returns_correct_value() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    assert await svc.is_feature_enabled("reims", "chat") is True


@pytest.mark.asyncio
async def test_is_feature_disabled_for_inactive_feature() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    assert await svc.is_feature_enabled("reims", "nonexistent") is False


@pytest.mark.asyncio
async def test_is_feature_disabled_for_unknown_city() -> None:
    svc = CityRegistryService(_FakeRedis())  # type: ignore[arg-type]
    assert await svc.is_feature_enabled("atlantis", "chat") is False


@pytest.mark.asyncio
async def test_register_and_list_returns_new_city() -> None:
    redis = _FakeRedis()
    svc = CityRegistryService(redis)  # type: ignore[arg-type]
    new_city = CityConfig(
        city_id="nancy",
        display_name="Nancy",
        center_lat=48.6921,
        center_lng=6.1844,
        zones=["centre", "stanislas"],
    )
    await svc.register_city(new_city)
    cities = await svc.list_cities()
    city_ids = [c.city_id for c in cities]
    assert "nancy" in city_ids
