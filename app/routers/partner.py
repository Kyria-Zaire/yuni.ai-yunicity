"""Partner SDK endpoints — API key management."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.partner import PartnerConfig, PartnerTier
from app.services.partner_auth_service import PartnerAuthService

logger = get_logger("partner_router")

router = APIRouter(tags=["partner"])


@router.post(
    "/v1/partner/register",
    summary="Creer un partenaire et generer une API key",
)
async def register_partner(
    request: Request,
    body: dict[str, Any],
    x_admin_token: str = Header(...),
) -> dict[str, Any]:
    settings = get_settings()
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")

    svc: PartnerAuthService = request.app.state.partner_auth_service

    tier_str = body.get("tier", "sandbox")
    try:
        tier = PartnerTier(tier_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier_str}") from None

    config, api_key = await svc.register_partner(
        name=body.get("name", ""),
        contact_email=body.get("contact_email", ""),
        tier=tier,
        allowed_cities=body.get("allowed_cities"),
    )

    return {
        "partner_id": config.partner_id,
        "name": config.name,
        "tier": config.tier.value,
        "api_key": api_key,
        "rate_limit_per_hour": config.rate_limit_per_hour,
        "message": "IMPORTANT: cette API key ne sera plus jamais affichee",
    }


@router.get(
    "/v1/partner/me",
    response_model=PartnerConfig,
    summary="Infos du partenaire authentifie",
)
async def get_partner_info(
    request: Request,
    x_api_key: str = Header(...),
) -> PartnerConfig:
    svc: PartnerAuthService = request.app.state.partner_auth_service
    config = await svc.verify_api_key(x_api_key)
    if not config or not config.active:
        raise HTTPException(status_code=401, detail="API key invalide")
    return config


@router.get(
    "/v1/partner/me/usage",
    summary="Quota utilise et restant",
)
async def get_partner_usage(
    request: Request,
    x_api_key: str = Header(...),
) -> dict[str, Any]:
    svc: PartnerAuthService = request.app.state.partner_auth_service
    config = await svc.verify_api_key(x_api_key)
    if not config:
        raise HTTPException(status_code=401, detail="API key invalide")

    within_limit = await svc.check_rate_limit(config.partner_id, config.tier)
    return {
        "partner_id": config.partner_id,
        "tier": config.tier.value,
        "rate_limit_per_hour": config.rate_limit_per_hour,
        "within_limit": within_limit,
    }
