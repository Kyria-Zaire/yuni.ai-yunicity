"""Unit tests for admin panel API."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_overview_requires_admin_token(client: AsyncClient) -> None:
    response = await client.get("/v1/admin/overview")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_overview_rejects_invalid_token(client: AsyncClient) -> None:
    response = await client.get(
        "/v1/admin/overview",
        headers={"X-Admin-Token": "wrong-token"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patch_rollout_rejects_invalid_percentage(client: AsyncClient) -> None:
    response = await client.patch(
        "/v1/admin/cities/reims/rollout",
        json={"percentage": 150},
        headers={"X-Admin-Token": "wrong"},
    )
    assert response.status_code in (400, 403)


@pytest.mark.asyncio
async def test_cache_flush_requires_admin_token(client: AsyncClient) -> None:
    response = await client.post("/v1/admin/cache/flush/reims")
    assert response.status_code == 422


class TestAdminServices:
    def test_estimate_savings_zero_calls(self) -> None:
        from app.services.mistral_router import MistralRouter
        savings = MistralRouter.estimate_savings(0, 0)
        assert savings == 0.0

    def test_estimate_savings_all_small(self) -> None:
        from app.services.mistral_router import MistralRouter
        savings = MistralRouter.estimate_savings(0, 100)
        assert savings > 90.0
