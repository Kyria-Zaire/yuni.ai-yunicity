"""Merchant content generation endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.merchant import ContentType, MerchantContentRequest, MerchantContentResponse
from app.services.merchant_content_service import MerchantContentService

logger = get_logger("merchant_router")

router = APIRouter(tags=["merchant"])


@router.post(
    "/v1/merchant/generate",
    response_model=MerchantContentResponse,
    summary="Générer du contenu marketing pour un commerçant",
    responses={
        200: {"description": "Contenu généré"},
        401: {"description": "JWT manquant"},
    },
)
async def generate_content(
    request: Request,
    body: MerchantContentRequest,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> MerchantContentResponse:
    mistral_client = request.app.state.mistral_client
    svc = MerchantContentService(mistral_client)
    return await svc.generate(body)


@router.get(
    "/v1/merchant/templates",
    summary="Lister les types de contenu disponibles",
    responses={200: {"description": "Templates disponibles"}},
)
async def list_templates() -> list[dict[str, str]]:
    descriptions = {
        ContentType.POST_SOCIAL: "Post court pour réseaux sociaux (280 chars max)",
        ContentType.POST_LONG: "Article ou post long (200-400 mots)",
        ContentType.PROMOTION: "Offre promotionnelle avec CTA",
        ContentType.NEWSLETTER: "Email newsletter engageante",
        ContentType.STORY: "Story Instagram/Facebook",
        ContentType.SMS: "SMS promotionnel (160 chars max)",
        ContentType.FLYER_TEXT: "Texte pour flyer imprimé",
    }
    return [
        {"type": ct.value, "description": descriptions.get(ct, ct.value)}
        for ct in ContentType
    ]
