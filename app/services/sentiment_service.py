"""NLP sentiment analysis for city zones."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from app.core.logging import get_logger
from app.models.sentiment import SentimentScore, ZoneSentiment

logger = get_logger("sentiment")

SENTIMENT_TTL = 60 * 60 * 24 * 7  # 7 days

SENTIMENT_PROMPT = """Analyse le sentiment de ces {count} messages \
citoyens du quartier {zone} a {city}.

Messages (anonymises) :
{messages}

Reponds UNIQUEMENT en JSON :
{{
  "mood_score": 0-100,
  "sentiment": "tres_positif|positif|neutre|negatif|tres_negatif",
  "top_topics": ["sujet1", "sujet2", "sujet3"],
  "summary": "Resume en une phrase"
}}"""


class SentimentService:
    """Analyses citizen posts to compute zone mood scores."""

    def __init__(self, mistral_client: Any, redis: Any) -> None:
        self._client = mistral_client
        self._redis = redis

    async def analyze_zone(
        self,
        city: str,
        zone: str,
        posts: list[str],
    ) -> ZoneSentiment:
        if not posts:
            return ZoneSentiment(
                city=city, zone=zone, mood_score=50,
                sentiment=SentimentScore.NEUTRE,
                trend="stable", top_topics=[], sample_count=0,
                computed_at=datetime.now(UTC),
                valid_until=datetime.now(UTC) + timedelta(days=7),
            )

        sample = posts[:50]
        clean_posts = [self._anonymize_post(p) for p in sample]
        messages_text = "\n".join(f"- {p[:200]}" for p in clean_posts)

        prompt = SENTIMENT_PROMPT.format(
            count=len(sample), zone=zone, city=city, messages=messages_text,
        )

        response = await self._client.chat.complete_async(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.1,
        )

        raw: str = response.choices[0].message.content
        result = self._parse_response(raw)

        prev_score = await self._get_previous_score(city, zone)
        trend = self._compute_trend(result.get("mood_score", 50), prev_score)

        mood = max(0.0, min(100.0, float(result.get("mood_score", 50))))
        sentiment_str = result.get("sentiment", "neutre")
        try:
            sentiment = SentimentScore(sentiment_str)
        except ValueError:
            sentiment = self._score_to_sentiment(mood)

        zone_sentiment = ZoneSentiment(
            city=city, zone=zone,
            mood_score=mood, sentiment=sentiment, trend=trend,
            top_topics=result.get("top_topics", [])[:3],
            sample_count=len(sample),
            computed_at=datetime.now(UTC),
            valid_until=datetime.now(UTC) + timedelta(days=7),
        )

        await self._redis.set(
            f"sentiment:v1:{city}:{zone}",
            zone_sentiment.model_dump_json(),
            ttl_seconds=SENTIMENT_TTL,
        )
        return zone_sentiment

    async def get_cached(self, city: str, zone: str) -> ZoneSentiment | None:
        raw = await self._redis.get(f"sentiment:v1:{city}:{zone}")
        if raw:
            return ZoneSentiment.model_validate_json(raw)
        return None

    async def _get_previous_score(self, city: str, zone: str) -> float | None:
        cached = await self.get_cached(city, zone)
        return cached.mood_score if cached else None

    @staticmethod
    def _compute_trend(
        current: float, previous: float | None,
    ) -> Literal["improving", "stable", "degrading"]:
        if previous is None:
            return "stable"
        diff = current - previous
        if diff > 5:
            return "improving"
        if diff < -5:
            return "degrading"
        return "stable"

    @staticmethod
    def _score_to_sentiment(score: float) -> SentimentScore:
        if score >= 80:
            return SentimentScore.TRES_POSITIF
        if score >= 60:
            return SentimentScore.POSITIF
        if score >= 40:
            return SentimentScore.NEUTRE
        if score >= 20:
            return SentimentScore.NEGATIF
        return SentimentScore.TRES_NEGATIF

    @staticmethod
    def _anonymize_post(text: str) -> str:
        text = re.sub(r"\S+@\S+", "[email]", text)
        text = re.sub(r"(\+33|0)[0-9\s\-\.]{9,}", "[tel]", text)
        text = re.sub(r"\d+[\s,]+rue\s+\w+", "[adresse]", text, flags=re.IGNORECASE)
        return text[:500]

    @staticmethod
    def _parse_response(raw: str) -> dict[str, Any]:
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```\w*\n?", "", cleaned).strip()
            return json.loads(cleaned)  # type: ignore[no-any-return]
        except (json.JSONDecodeError, ValueError):
            return {"mood_score": 50, "sentiment": "neutre", "top_topics": []}
