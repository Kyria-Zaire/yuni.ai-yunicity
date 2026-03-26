"""Unit tests for environment guards."""

import pytest

from app.core.config import Settings
from app.core.exceptions import WebhookBlockedError
from app.core.guards import guard_stripe_test_key, guard_webhook_env


def test_guard_webhook_blocks_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev")
    with pytest.raises(WebhookBlockedError):
        guard_webhook_env(settings)


def test_guard_webhook_blocks_in_recette() -> None:
    settings = Settings(YUNI_ENV="recette")
    with pytest.raises(WebhookBlockedError):
        guard_webhook_env(settings)


def test_guard_webhook_allows_prod() -> None:
    settings = Settings(YUNI_ENV="prod")
    guard_webhook_env(settings)  # Should not raise


def test_guard_stripe_test_key_ok_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev", STRIPE_SECRET_KEY="sk_test_abc")
    guard_stripe_test_key(settings)  # Should not raise


def test_guard_stripe_live_key_blocked_in_dev() -> None:
    settings = Settings(YUNI_ENV="dev", STRIPE_SECRET_KEY="sk_live_abc")
    with pytest.raises(ValueError, match="Live Stripe key"):
        guard_stripe_test_key(settings)


def test_guard_stripe_any_key_ok_in_prod() -> None:
    settings = Settings(YUNI_ENV="prod", STRIPE_SECRET_KEY="sk_live_abc")
    guard_stripe_test_key(settings)  # Should not raise in prod
