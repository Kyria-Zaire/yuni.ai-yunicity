"""Predictive analytics — 7-day urban flow forecasting."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any, Literal

from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.services.mistral_router import MistralRouter, MistralTaskType

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("predictive")

FORECAST_TTL = 60 * 60 * 6  # 6 hours

DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]

PREDICTION_PROMPT = """Tu es un analyste urbain pour {city}.
Preds l'affluence dans le quartier {zone} pour les 7 prochains jours.

Saison actuelle : {season}

Pour chaque jour, preds :
- Niveau : faible / modere / eleve / tres_eleve
- Facteurs contribuants (max 3)
- Confiance (0.0-1.0)

Reponds UNIQUEMENT en JSON :
{{
  "predictions": [
    {{"date": "YYYY-MM-DD", "day_of_week": "lundi", "predicted_level": "modere",
      "confidence": 0.75, "contributing_factors": ["facteur1"]}}
  ],
  "peak_day": "samedi",
  "quiet_day": "mardi",
  "recommended_events_days": ["jeudi", "vendredi"]
}}"""


class AffluencePrediction(BaseModel):
    city: str
    zone: str
    date: str
    day_of_week: str
    predicted_level: Literal["faible", "modere", "eleve", "tres_eleve"]
    confidence: float = Field(ge=0, le=1)
    contributing_factors: list[str] = Field(default_factory=list)


class WeeklyForecast(BaseModel):
    city: str
    zone: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    predictions: list[AffluencePrediction] = Field(default_factory=list)
    peak_day: str = ""
    quiet_day: str = ""
    recommended_events_days: list[str] = Field(default_factory=list)


class PredictiveService:
    """Forecasts urban flow using Mistral Small for cost efficiency."""

    def __init__(
        self, mistral_router: MistralRouter, redis: RedisService, client: Any,
    ) -> None:
        self._router = mistral_router
        self._redis = redis
        self._client = client

    async def forecast_week(
        self, city: str, zone: str,
    ) -> WeeklyForecast:
        cached = await self._redis.get(f"forecast:v1:{city}:{zone}")
        if cached:
            return WeeklyForecast.model_validate_json(cached)

        prompt = PREDICTION_PROMPT.format(
            city=city, zone=zone, season=self._current_season(),
        )

        text, _model = await self._router.complete(
            MistralTaskType.SENTIMENT_ANALYSIS,
            [{"role": "user", "content": prompt}],
            client=self._client,
            max_tokens=800,
            temperature=0.2,
        )

        forecast = self._parse_response(text, city, zone)

        await self._redis.set(
            f"forecast:v1:{city}:{zone}",
            forecast.model_dump_json(),
            ttl_seconds=FORECAST_TTL,
        )
        return forecast

    def _parse_response(
        self, raw: str, city: str, zone: str,
    ) -> WeeklyForecast:
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```\w*\n?", "", cleaned).strip()
            data = json.loads(cleaned)

            predictions: list[AffluencePrediction] = []
            today = datetime.now(UTC)
            for i, pred in enumerate(data.get("predictions", [])[:7]):
                d = today + timedelta(days=i)
                level = pred.get("predicted_level", "modere")
                if level not in ("faible", "modere", "eleve", "tres_eleve"):
                    level = "modere"
                predictions.append(AffluencePrediction(
                    city=city,
                    zone=zone,
                    date=d.strftime("%Y-%m-%d"),
                    day_of_week=DAYS_FR[d.weekday()],
                    predicted_level=level,
                    confidence=min(1.0, max(0.0, float(pred.get("confidence", 0.5)))),
                    contributing_factors=pred.get("contributing_factors", [])[:3],
                ))

            return WeeklyForecast(
                city=city,
                zone=zone,
                predictions=predictions,
                peak_day=data.get("peak_day", "samedi"),
                quiet_day=data.get("quiet_day", "mardi"),
                recommended_events_days=data.get("recommended_events_days", []),
            )
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._default_forecast(city, zone)

    def _default_forecast(self, city: str, zone: str) -> WeeklyForecast:
        today = datetime.now(UTC)
        predictions = []
        for i in range(7):
            d = today + timedelta(days=i)
            is_weekend = d.weekday() >= 5
            predictions.append(AffluencePrediction(
                city=city, zone=zone,
                date=d.strftime("%Y-%m-%d"),
                day_of_week=DAYS_FR[d.weekday()],
                predicted_level="eleve" if is_weekend else "modere",
                confidence=0.5,
                contributing_factors=["estimation par defaut"],
            ))
        return WeeklyForecast(
            city=city, zone=zone, predictions=predictions,
            peak_day="samedi", quiet_day="mardi",
            recommended_events_days=["jeudi", "vendredi"],
        )

    @staticmethod
    def _current_season() -> str:
        month = datetime.now(UTC).month
        if month in (3, 4, 5):
            return "printemps"
        if month in (6, 7, 8):
            return "ete"
        if month in (9, 10, 11):
            return "automne"
        return "hiver"
