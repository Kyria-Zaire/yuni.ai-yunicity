"""Unit tests for RGPD DELETE endpoint (YAI-015)."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from tests.fixtures.auth_fixtures import TEST_RSA_PUBLIC_KEY, create_test_jwt

VALID_HASH = "a" * 64


@pytest.fixture
async def client():  # type: ignore[no-untyped-def]
    from app.core.config import get_settings
    get_settings.cache_clear()

    with patch.dict(os.environ, {
        "YUNI_ENV": "dev",
        "JWT_PUBLIC_KEY": TEST_RSA_PUBLIC_KEY,
        "ALLOWED_HOSTS": "*",
    }):
        get_settings.cache_clear()
        from app.main import create_app
        app = create_app()

        mock_svc = MagicMock()
        mock_svc.get_recommendations = AsyncMock(return_value=(MagicMock(), "yuni_ai_cache"))
        app.state.recommendation_service = mock_svc

        mock_rollout = MagicMock()
        mock_rollout.is_eligible = MagicMock(return_value=True)
        mock_rollout.rollout_percentage = 10
        app.state.rollout_service = mock_rollout

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as ac:
            yield ac

    get_settings.cache_clear()


class TestRGPDDelete:
    @pytest.mark.asyncio
    async def test_delete_valid_hash_returns_200(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        with patch(
            "app.routers.rgpd.get_redis_service",
        ) as mock_redis:
            mock_redis_inst = AsyncMock()
            mock_redis_inst.delete_pattern = AsyncMock(return_value=0)
            mock_redis.return_value = mock_redis_inst
            resp = await client.delete(
                f"/v1/ai/user-data/{VALID_HASH}",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["deleted"] is True

    @pytest.mark.asyncio
    async def test_delete_invalid_hash_format_returns_422(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        resp = await client.delete(
            "/v1/ai/user-data/not-a-valid-hash",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_delete_without_jwt_returns_401(self, client: AsyncClient) -> None:
        resp = await client.delete(f"/v1/ai/user-data/{VALID_HASH}")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_response_masks_hash(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        with patch(
            "app.routers.rgpd.get_redis_service",
        ) as mock_redis:
            mock_redis_inst = AsyncMock()
            mock_redis_inst.delete_pattern = AsyncMock(return_value=0)
            mock_redis.return_value = mock_redis_inst
            resp = await client.delete(
                f"/v1/ai/user-data/{VALID_HASH}",
                headers={"Authorization": f"Bearer {token}"},
            )
        data = resp.json()
        assert VALID_HASH not in data["user_hash"]
        assert data["user_hash"].endswith("...")

    @pytest.mark.asyncio
    async def test_delete_returns_cache_keys_deleted_count(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        with patch(
            "app.routers.rgpd.get_redis_service",
        ) as mock_redis:
            mock_redis_inst = AsyncMock()
            mock_redis_inst.delete_pattern = AsyncMock(return_value=3)
            mock_redis.return_value = mock_redis_inst
            resp = await client.delete(
                f"/v1/ai/user-data/{VALID_HASH}",
                headers={"Authorization": f"Bearer {token}"},
            )
        data = resp.json()
        assert data["details"]["cache_keys_deleted"] == 3

    @pytest.mark.asyncio
    async def test_delete_logs_deletion_request(self, client: AsyncClient) -> None:
        token = create_test_jwt()
        with (
            patch("app.routers.rgpd.get_redis_service") as mock_redis,
            patch("app.routers.rgpd.log_deletion_request") as mock_log,
        ):
            mock_redis_inst = AsyncMock()
            mock_redis_inst.delete_pattern = AsyncMock(return_value=0)
            mock_redis.return_value = mock_redis_inst
            mock_log.return_value = None
            resp = await client.delete(
                f"/v1/ai/user-data/{VALID_HASH}",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 200
        mock_log.assert_called_once()
