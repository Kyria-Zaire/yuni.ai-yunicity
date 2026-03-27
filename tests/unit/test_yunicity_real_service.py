"""Unit tests for RealYunicityHTTPService (YAI-014) using respx."""

from __future__ import annotations

from unittest.mock import MagicMock

import httpx
import pytest
import respx

from app.models.yunicity import MapData, Tribe, UserPassport
from app.services.yunicity_real_service import RealYunicityHTTPService


def _make_settings(
    base_url: str = "https://api.yunicity.test",
    token: str = "svc-token-123",
) -> MagicMock:
    settings = MagicMock()
    settings.YUNICITY_API_BASE_URL = base_url
    mock_secret = MagicMock()
    mock_secret.get_secret_value.return_value = token
    settings.YUNICITY_SERVICE_TOKEN = mock_secret
    return settings


PASSPORT_JSON = {
    "user_id_hash": "a" * 64,
    "points": 450,
    "level": "acteur",
    "badges": ["early"],
    "interests": ["sport"],
    "joined_at": "2025-06-01T00:00:00Z",
}

MAP_DATA_JSON = {
    "actors": [
        {
            "id": "a1", "name": "Club", "category": "sport", "city": "Reims",
            "geo": {"lat": 49.25, "lng": 4.03},
            "description": "Un club", "tags": ["sport"],
        },
    ],
    "tribes": [],
    "events": [],
    "zone": "reims-center",
}


class TestGetUserPassport:
    @pytest.mark.asyncio
    @respx.mock
    async def test_get_user_passport_success(self) -> None:
        respx.get("https://api.yunicity.test/users/gamification/passport/" + "a" * 64).mock(
            return_value=httpx.Response(200, json=PASSPORT_JSON),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_user_passport("a" * 64)
        assert isinstance(result, UserPassport)
        assert result.level == "acteur"

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_user_passport_404_returns_default(self) -> None:
        respx.get("https://api.yunicity.test/users/gamification/passport/" + "a" * 64).mock(
            return_value=httpx.Response(404),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_user_passport("a" * 64)
        assert result.level == "citoyen"
        assert result.points == 0

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_user_passport_timeout_returns_default(self) -> None:
        respx.get("https://api.yunicity.test/users/gamification/passport/" + "b" * 64).mock(
            side_effect=httpx.ConnectTimeout("timeout"),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_user_passport("b" * 64)
        assert result.level == "citoyen"


class TestGetCityTribes:
    @pytest.mark.asyncio
    @respx.mock
    async def test_get_city_tribes_success(self) -> None:
        tribes_json = {
            "tribes": [
                {
                    "id": "t1", "name": "Sport Reims", "city": "Reims",
                    "category": "sport", "members_count": 100,
                    "activity_score": 8.0, "description": "Sport tribe",
                },
            ],
        }
        respx.get("https://api.yunicity.test/community/tribes").mock(
            return_value=httpx.Response(200, json=tribes_json),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_city_tribes("reims")
        assert len(result) == 1
        assert isinstance(result[0], Tribe)

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_city_tribes_error_returns_empty_list(self) -> None:
        respx.get("https://api.yunicity.test/community/tribes").mock(
            return_value=httpx.Response(500),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_city_tribes("reims")
        assert result == []


class TestGetMapData:
    @pytest.mark.asyncio
    @respx.mock
    async def test_get_map_data_success(self) -> None:
        respx.get("https://api.yunicity.test/map/data").mock(
            return_value=httpx.Response(200, json=MAP_DATA_JSON),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_map_data(49.25, 4.03)
        assert isinstance(result, MapData)
        assert len(result.actors) == 1

    @pytest.mark.asyncio
    @respx.mock
    async def test_get_map_data_error_returns_empty_map_data(self) -> None:
        respx.get("https://api.yunicity.test/map/data").mock(
            return_value=httpx.Response(503),
        )
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(), client)
            result = await svc.get_map_data(49.25, 4.03)
        assert result.actors == []
        assert result.zone == "unknown"


class TestSecurityHeaders:
    @pytest.mark.asyncio
    @respx.mock
    async def test_service_token_in_authorization_header(self) -> None:
        route = respx.get("https://api.yunicity.test/users/gamification/passport/" + "a" * 64)
        route.mock(return_value=httpx.Response(200, json=PASSPORT_JSON))
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(token="my-svc-token"), client)
            await svc.get_user_passport("a" * 64)
        assert route.called
        auth = route.calls[0].request.headers["authorization"]
        assert auth == "Bearer my-svc-token"

    @pytest.mark.asyncio
    @respx.mock
    async def test_user_jwt_never_forwarded_to_yunicity(self) -> None:
        route = respx.get("https://api.yunicity.test/users/gamification/passport/" + "a" * 64)
        route.mock(return_value=httpx.Response(200, json=PASSPORT_JSON))
        async with httpx.AsyncClient() as client:
            svc = RealYunicityHTTPService(_make_settings(token="svc-token"), client)
            await svc.get_user_passport("a" * 64)
        auth = route.calls[0].request.headers["authorization"]
        assert "user-jwt" not in auth.lower()
        assert auth == "Bearer svc-token"
