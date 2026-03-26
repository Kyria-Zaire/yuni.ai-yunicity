"""Environment guards — prevent dangerous operations outside production."""

from app.core.config import Settings
from app.core.exceptions import WebhookBlockedError


def guard_webhook_env(settings: Settings) -> None:
    """Block webhook execution outside production.

    Raises WebhookBlockedError if YUNI_ENV is not 'prod'.
    """
    if not settings.is_prod:
        raise WebhookBlockedError()


def guard_stripe_test_key(settings: Settings) -> None:
    """Ensure Stripe test key is used outside production.

    Raises AssertionError if a live key is detected in non-prod environments.
    """
    if not settings.is_prod:
        key = settings.STRIPE_SECRET_KEY.get_secret_value()
        if not key.startswith("sk_test_"):
            msg = "Live Stripe key detected in non-production environment"
            raise ValueError(msg)
