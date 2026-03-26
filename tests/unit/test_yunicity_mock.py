"""Unit tests for MockYunicityAPIService."""

import os
from datetime import UTC, datetime

import pytest

# Disable simulated latency in tests
os.environ["DISABLE_MOCK_LATENCY"] = "true"

from app.mocks.yunicity_mock_service import MockYunicityAPIService


@pytest.fixture
def mock_service() -> MockYunicityAPIService:
    return MockYunicityAPIService()


@pytest.mark.asyncio
async def test_mock_returns_5_tribes_for_reims(mock_service: MockYunicityAPIService) -> None:
    tribes = await mock_service.get_city_tribes("Reims")
    assert len(tribes) == 5


@pytest.mark.asyncio
async def test_mock_tribes_have_valid_schema(mock_service: MockYunicityAPIService) -> None:
    tribes = await mock_service.get_city_tribes("Reims")
    for tribe in tribes:
        assert tribe.id
        assert tribe.name
        assert tribe.city == "Reims"
        assert tribe.members_count > 0
        assert 0 <= tribe.activity_score <= 10


@pytest.mark.asyncio
async def test_mock_returns_actors_with_correct_schema(
    mock_service: MockYunicityAPIService,
) -> None:
    data = await mock_service.get_map_data(49.25, 4.03)
    assert len(data.actors) == 6
    for actor in data.actors:
        assert actor.id
        assert actor.name
        assert "lat" in actor.geo
        assert "lng" in actor.geo


@pytest.mark.asyncio
async def test_mock_returns_events_in_future(mock_service: MockYunicityAPIService) -> None:
    data = await mock_service.get_map_data(49.25, 4.03)
    assert len(data.events) == 8
    now = datetime.now(UTC)
    for event in data.events:
        assert event.date > now


@pytest.mark.asyncio
async def test_mock_user_passport(mock_service: MockYunicityAPIService) -> None:
    passport = await mock_service.get_user_passport("test-hash-123")
    assert passport.user_id_hash == "test-hash-123"
    assert passport.points > 0
    assert passport.level in ("citoyen", "acteur", "ambassadeur")


@pytest.mark.asyncio
async def test_mock_returns_empty_for_unknown_city(
    mock_service: MockYunicityAPIService,
) -> None:
    tribes = await mock_service.get_city_tribes("Paris")
    assert len(tribes) == 0


@pytest.mark.asyncio
async def test_mock_map_data_zone(mock_service: MockYunicityAPIService) -> None:
    data = await mock_service.get_map_data(49.25, 4.03)
    assert data.zone == "reims-49.25-4.03"
