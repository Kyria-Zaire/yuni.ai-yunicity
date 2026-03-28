"""Stripe webhook endpoint with full security guards."""

from __future__ import annotations

from typing import Any

import stripe
from fastapi import APIRouter, HTTPException, Request

from app.core.config import Settings, get_settings
from app.core.exceptions import WebhookBlockedError
from app.core.logging import get_logger
from app.services.redis_service import get_redis_service
from app.services.subscription_service import SubscriptionService, SubscriptionStatus

logger = get_logger("stripe_webhook")

router = APIRouter()


def _guard_webhook_env(settings: Settings) -> None:
    """Block webhook processing outside production."""
    if settings.YUNI_ENV != "prod":
        raise WebhookBlockedError()


def _guard_stripe_test_key(settings: Settings) -> None:
    """In dev/recette, Stripe key MUST start with sk_test_."""
    if settings.YUNI_ENV in ("dev", "recette", "recette_mock"):
        key = settings.STRIPE_SECRET_KEY.get_secret_value()
        if not key.startswith("sk_test_"):
            msg = "Stripe key must be a test key in non-prod environments"
            raise ValueError(msg)


@router.post("/v1/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request) -> dict[str, str]:
    settings = get_settings()

    _guard_webhook_env(settings)
    _guard_stripe_test_key(settings)

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event: Any = stripe.Webhook.construct_event(  # type: ignore[no-untyped-call]
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET.get_secret_value(),
        )
    except stripe.error.SignatureVerificationError as sig_err:
        logger.warning("stripe_webhook_invalid_signature")
        raise HTTPException(status_code=400, detail="Invalid signature") from sig_err
    except Exception as exc:
        logger.error("stripe_webhook_parse_error", error=str(exc))
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    redis = get_redis_service()
    event_key = f"stripe_event:{event.id}"
    if await redis.get(event_key):
        logger.info("stripe_webhook_duplicate", event_id=event.id)
        return {"status": "already_processed"}

    sub_svc = SubscriptionService(redis)
    await _process_event(event, sub_svc)

    await redis.set(event_key, "processed", ttl_seconds=60 * 60 * 24 * 30)
    return {"status": "processed"}


async def _process_event(event: Any, sub_svc: SubscriptionService) -> None:
    user_id_hash: str | None = (
        event.data.object.get("metadata", {}).get("user_id_hash")
    )
    if not user_id_hash:
        logger.warning(
            "stripe_event_missing_user_hash", event_type=event.type,
        )
        return

    if event.type == "customer.subscription.created":
        plan_name = event.data.object.get("plan", {}).get("nickname", "pro")
        status = (
            SubscriptionStatus.PRO_PLUS
            if "plus" in plan_name.lower()
            else SubscriptionStatus.PRO
        )
        await sub_svc.set_user_status(user_id_hash, status)

    elif event.type in (
        "customer.subscription.deleted",
        "customer.subscription.paused",
        "invoice.payment_failed",
    ):
        await sub_svc.set_user_status(user_id_hash, SubscriptionStatus.FREE)
