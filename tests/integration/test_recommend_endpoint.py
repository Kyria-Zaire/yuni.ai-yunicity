"""Integration tests for POST /v1/recommend/engagement (YAI-010)."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from tests.fixtures.auth_fixtures import TEST_RSA_PUBLIC_KEY, create_test_jwt
from tests.fixtures.recommend_fixtures import (
    VALID_USER_ID_HASH,
    make_recommendation_output,
)

os.environ.setdefault("YUNI_ENV", "dev")
os.environ.setdefault("JWT_PUBLIC_KEY", TEST_RSA_PUBLIC_KEY)
os.environ.setdefault("DISABLE_MOCK_LATENCY", "true")


VALID_BODY = {
    "user_id_hash": VALID_USER_ID_HASH,
    "city": "reims",
    "interests": ["sport", "culture"],
    "points": 340,
    "geo": {"lat_truncated": 49.25, "lng_truncated": 4.03},
}


def _mock_recommendation_service() -> MagicMock:
    svc = MagicMock()
    svc.get_recommendations = AsyncMock(
        return_value=(make_recommendation_output("yuni_ai_mistral"), "yuni_ai_mistral")
    )
    return svc


@pytest.fixture
def mock_svc() -> MagicMock:
    return _mock_recommendation_service()


@pytest.fixture
async def client(mock_svc: MagicMock):  # type: ignore[no-untyped-def]
    from app.core.config import get_settings
    get_settings.cache_clear()

    with patch.dict(os.environ, {
        "YUNI_ENV": "dev",
        "JWT_PUBLIC_KEY": TEST_RSA_PUBLIC_KEY,
        "ALLOWED_HOSTS": "*",
        "DISABLE_MOCK_LATENCY": "true",
    }):
        get_settings.cache_clear()
        from app.main import create_app
        app = create_app()
        app.state.recommendation_service = mock_svc

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as ac:
            yield ac

    get_settings.cache_clear()


class TestAuth:
    @pytest.mark.asyncio
    async def test_missing_jwt_returns_401(self, client: AsyncClient) -> None:
        resp = await client.post("/v1/recommend/engagement", json=VALID_BODY)
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_jwt_returns_401(self, client: AsyncClient) -> None:
        token = create_test_jwt(invalid_signature=True)
        resp = await client.post(
            "/v1/recommend/engagement",
            json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_jwt_returns_401(self, client: AsyncClient) -> None:
        token = create_test_jwt(expired=True)
        resp = await client.post(
            "/v1/recommend/engagement",
            json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_valid_jwt_returns_200(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement",
            json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


class TestValidation:
    @pytest.mark.asyncio
    async def test_invalid_user_id_hash_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        body = {**VALID_BODY, "user_id_hash": "short"}
        resp = await client.post(
            "/v1/recommend/engagement", json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_unknown_interest_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        body = {**VALID_BODY, "interests": ["blockchain"]}
        resp = await client.post(
            "/v1/recommend/engagement", json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_geo_coordinates_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        body = {**VALID_BODY, "geo": {"lat_truncated": 999.0, "lng_truncated": 4.03}}
        resp = await client.post(
            "/v1/recommend/engagement", json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_extra_fields_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        body = {**VALID_BODY, "extra_field": "oops"}
        resp = await client.post(
            "/v1/recommend/engagement", json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_points_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        body = {**VALID_BODY, "points": -5}
        resp = await client.post(
            "/v1/recommend/engagement", json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422


class TestBehavior:
    @pytest.mark.asyncio
    async def test_response_schema_matches_contract(
        self, client: AsyncClient, mock_svc: MagicMock,
    ) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "meta" in data
        assert "actors" in data["data"]
        assert "tribes" in data["data"]
        assert "events" in data["data"]
        assert "reason" in data["data"]
        assert "source" in data["data"]

    @pytest.mark.asyncio
    async def test_response_meta_contains_request_id(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()
        assert "request_id" in data["meta"]

    @pytest.mark.asyncio
    async def test_response_meta_contains_latency_ms(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()
        assert "latency_ms" in data["meta"]

    @pytest.mark.asyncio
    async def test_response_has_security_headers(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"

    @pytest.mark.asyncio
    async def test_no_pii_in_response_body(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY,
            headers={"Authorization": f"Bearer {token}"},
        )
        text = resp.text
        assert VALID_USER_ID_HASH not in text


class TestE2E:
    @pytest.mark.asyncio
    async def test_full_cycle_cache_miss_to_hit(
        self, client: AsyncClient, mock_svc: MagicMock,
    ) -> None:
        token = create_test_jwt()
        headers = {"Authorization": f"Bearer {token}"}

        resp1 = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY, headers=headers,
        )
        assert resp1.status_code == 200
        assert resp1.json()["data"]["source"] == "yuni_ai_mistral"

        mock_svc.get_recommendations = AsyncMock(
            return_value=(make_recommendation_output("yuni_ai_cache"), "yuni_ai_cache")
        )

        resp2 = await client.post(
            "/v1/recommend/engagement", json=VALID_BODY, headers=headers,
        )
        assert resp2.status_code == 200
        assert resp2.json()["data"]["source"] == "yuni_ai_cache"
