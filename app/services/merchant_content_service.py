"""AI-powered content generation for local merchants."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any

from app.core.logging import get_logger
from app.models.merchant import (
    ContentType,
    GeneratedContent,
    MerchantContentRequest,
    MerchantContentResponse,
)

logger = get_logger("merchant_content")


CONTENT_PROMPTS: dict[ContentType, str] = {
    ContentType.POST_SOCIAL: (
        "Génère un post accrocheur pour les réseaux sociaux. "
        "Max 280 caractères. Inclure des emojis si demandé. Ton: {tone}. "
        "Hashtags locaux pertinents pour {city}."
    ),
    ContentType.PROMOTION: (
        "Génère une offre promotionnelle attractive. "
        "Inclure : l'offre, la durée, l'appel à l'action. Max 150 mots. "
        "Ton: {tone}. Pour {city}."
    ),
    ContentType.NEWSLETTER: (
        "Génère une newsletter email engageante. "
        "Structure : accroche, corps, CTA. Entre 100 et 200 mots. "
        "Ton: {tone}. Adapté au public: {audience}."
    ),
    ContentType.SMS: (
        "Génère un SMS promotionnel. "
        "STRICT : maximum 160 caractères. "
        "Inclure le nom du commerce et un CTA court."
    ),
    ContentType.STORY: (
        "Génère le texte d'une story Instagram/Facebook. "
        "Court, percutant, 1-3 phrases maximum. Avec hashtags si demandé."
    ),
    ContentType.POST_LONG: (
        "Génère un article ou post long engageant. "
        "Entre 200 et 400 mots. Structuré avec introduction et conclusion. "
        "Ton: {tone}. Pour {city}."
    ),
    ContentType.FLYER_TEXT: (
        "Génère le texte d'un flyer promotionnel. "
        "Accroche forte, offre claire, coordonnées. Max 200 mots. "
        "Ton: {tone}."
    ),
}

SYSTEM_PROMPT = (
    "Tu es l'assistant marketing de {business_name}, "
    "{business_type} situé à {city}. "
    "Tu génères du contenu local, authentique et engageant. "
    "Tu parles en français, avec le ton demandé. "
    "Tu connais les codes des réseaux sociaux locaux français. "
    "Tu ne génères JAMAIS de contenu trompeur ou mensonger."
)

FORBIDDEN_PATTERNS = [
    r"ignore (previous|above|all) instructions",
    r"you are now",
    r"act as",
    r"jailbreak",
    r"syst[eè]me",
    r"system prompt",
]


class MerchantContentService:
    """Generates marketing content for local merchants using Mistral."""

    def __init__(self, mistral_client: Any) -> None:
        self._client = mistral_client

    async def generate(
        self,
        request: MerchantContentRequest,
    ) -> MerchantContentResponse:
        safe_topic = self._sanitize_for_prompt(request.topic)
        safe_business = self._sanitize_for_prompt(request.business_name)

        system = SYSTEM_PROMPT.format(
            business_name=safe_business,
            business_type=request.business_type,
            city=request.city,
        )

        content_prompt = CONTENT_PROMPTS.get(
            request.content_type,
            CONTENT_PROMPTS[ContentType.POST_SOCIAL],
        ).format(
            tone=request.tone,
            city=request.city,
            audience=request.target_audience or "grand public",
        )

        user_message = (
            f"Commerce : {safe_business} ({request.business_type}) à {request.city}\n"
            f"Sujet/Promo : {safe_topic}\n"
            f"Type de contenu : {request.content_type.value}\n"
            f"Emojis : {'oui' if request.include_emoji else 'non'}\n\n"
            f"{content_prompt}\n\n"
            'Réponds UNIQUEMENT en JSON :\n'
            '{\n'
            '  "main_content": "texte principal",\n'
            '  "suggestions": ["variante 1", "variante 2"],\n'
            '  "hashtags": ["#hashtag1", "#hashtag2"],\n'
            '  "best_post_time": "Mardi 18h-20h ou null"\n'
            '}'
        )

        response = await self._client.chat.complete_async(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_message},
            ],
            max_tokens=800,
            temperature=0.8,
        )

        raw: str = response.choices[0].message.content
        parsed = self._parse_content_response(raw, request.content_type)

        return MerchantContentResponse(
            business_name=request.business_name,
            contents=[parsed],
            total_generated=1,
        )

    @staticmethod
    def _sanitize_for_prompt(text: str) -> str:
        for pattern in FORBIDDEN_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                msg = "Contenu non autorisé détecté"
                raise ValueError(msg)
        return text[:500]

    @staticmethod
    def _parse_content_response(
        raw: str, content_type: ContentType,
    ) -> GeneratedContent:
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```\w*\n?", "", cleaned).strip()
            data: dict[str, Any] = json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            data = {"main_content": raw.strip()}

        main_text = str(data.get("main_content", raw.strip()))

        return GeneratedContent(
            content_type=content_type,
            text=main_text,
            char_count=len(main_text),
            suggestions=data.get("suggestions", []),
            hashtags=data.get("hashtags", []),
            best_post_time=data.get("best_post_time"),
            generated_at=datetime.now(UTC),
        )
