"""Unit tests for SubscriptionService and Stripe webhook guards."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.core.config import Settings
from app.core.exceptions import WebhookBlockedError
from app.routers.stripe_webhook import _guard_stripe_test_key, _guard_webhook_env
from app.services.subscription_service import SubscriptionService, SubscriptionStatus


def _make_redis(stored: str | None = None) -> AsyncMock:
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=stored)
    mock.set = AsyncMock(return_value=True)
    return mock


@pytest.mark.asyncio
async def test_free_user_by_default() -> None:
    svc = SubscriptionService(_make_redis())
    status = await svc.get_user_status("abc123")
    assert status == SubscriptionStatus.FREE


@pytest.mark.asyncio
async def test_set_and_get_pro_status() -> None:
    redis = _make_redis("pro")
    svc = SubscriptionService(redis)
    status = await svc.get_user_status("abc123")
    assert status == SubscriptionStatus.PRO


@pytest.mark.asyncio
async def test_set_user_status_calls_redis_set() -> None:
    redis = _make_redis()
    svc = SubscriptionService(redis)
    await svc.set_user_status("abc", SubscriptionStatus.PRO)
    redis.set.assert_called_once()


def test_webhook_blocked_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev")
    with pytest.raises(WebhookBlockedError):
        _guard_webhook_env(settings)


def test_webhook_blocked_in_recette() -> None:
    settings = Settings(YUNI_ENV="recette")
    with pytest.raises(WebhookBlockedError):
        _guard_webhook_env(settings)


def test_webhook_allowed_in_prod() -> None:
    settings = Settings(YUNI_ENV="prod")
    _guard_webhook_env(settings)


def test_stripe_key_must_be_test_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev", STRIPE_SECRET_KEY="sk_live_oops")
    with pytest.raises(ValueError, match="test key"):
        _guard_stripe_test_key(settings)


def test_stripe_test_key_passes_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev", STRIPE_SECRET_KEY="sk_test_ok")
    _guard_stripe_test_key(settings)


def test_feature_gate_402_for_free_user() -> None:
    assert not SubscriptionService.requires_pro(SubscriptionStatus.FREE)


def test_feature_gate_passes_for_pro_user() -> None:
    assert SubscriptionService.requires_pro(SubscriptionStatus.PRO)


def test_feature_gate_passes_for_pro_plus() -> None:
    assert SubscriptionService.requires_pro(SubscriptionStatus.PRO_PLUS)


@pytest.mark.asyncio
async def test_webhook_missing_user_hash_handled() -> None:
    """SubscriptionService handles missing user data gracefully."""
    redis = _make_redis()
    svc = SubscriptionService(redis)
    status = await svc.get_user_status("")
    assert status == SubscriptionStatus.FREE
