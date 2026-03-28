"""Newcomer onboarding guide endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.logging import get_logger
from app.models.onboarding import OnboardingGuide
from app.services.onboarding_service import OnboardingService

logger = get_logger("onboarding_router")

router = APIRouter(tags=["onboarding"])


@router.get(
    "/v1/onboarding/{city}",
    response_model=OnboardingGuide,
    summary="Guide d'intégration pour nouveaux arrivants",
    responses={200: {"description": "Guide complet"}},
)
async def get_onboarding_guide(city: str) -> OnboardingGuide:
    svc = OnboardingService()
    return await svc.get_guide(city)


@router.get(
    "/v1/onboarding/{city}/voice/{step}",
    summary="Texte du tour vocal pour une étape",
    responses={200: {"description": "Texte pour TTS"}},
)
async def get_voice_step(city: str, step: int) -> dict[str, str]:
    svc = OnboardingService()
    text = await svc.get_voice_tour(city, step)
    return {"city": city, "step": str(step), "text": text}
