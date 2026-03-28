"""Unit tests for PredictiveService — urban flow forecasting."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.predictive_service import PredictiveService


def _make_service(ai_response: str | None = None) -> PredictiveService:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()

    router = MagicMock()
    if ai_response is None:
        ai_response = json.dumps({
            "predictions": [
                {
                    "date": "2026-11-01",
                    "day_of_week": "dimanche",
                    "predicted_level": "eleve",
                    "confidence": 0.8,
                    "contributing_factors": ["weekend", "beau temps"],
                }
            ] * 7,
            "peak_day": "samedi",
            "quiet_day": "mardi",
            "recommended_events_days": ["jeudi", "vendredi"],
        })
    router.complete = AsyncMock(return_value=(ai_response, "mistral-small-latest"))

    client = MagicMock()
    return PredictiveService(mistral_router=router, redis=redis, client=client)


class TestForecast:
    @pytest.mark.asyncio
    async def test_forecast_returns_7_days(self) -> None:
        svc = _make_service()
        forecast = await svc.forecast_week("reims", "centre")
        assert len(forecast.predictions) == 7

    @pytest.mark.asyncio
    async def test_forecast_uses_mistral_small_for_cost(self) -> None:
        svc = _make_service()
        await svc.forecast_week("reims", "centre")
        svc._router.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_peak_day_identified(self) -> None:
        svc = _make_service()
        forecast = await svc.forecast_week("reims", "centre")
        assert forecast.peak_day != ""

    @pytest.mark.asyncio
    async def test_recommended_events_days_not_empty(self) -> None:
        svc = _make_service()
        forecast = await svc.forecast_week("reims", "centre")
        assert len(forecast.recommended_events_days) > 0

    @pytest.mark.asyncio
    async def test_confidence_between_0_and_1(self) -> None:
        svc = _make_service()
        forecast = await svc.forecast_week("reims", "centre")
        for pred in forecast.predictions:
            assert 0 <= pred.confidence <= 1

    @pytest.mark.asyncio
    async def test_forecast_cached_6_hours(self) -> None:
        svc = _make_service()
        await svc.forecast_week("reims", "centre")
        svc._redis.set.assert_called_once()
        call_args = svc._redis.set.call_args
        assert call_args.kwargs.get("ttl_seconds") == 60 * 60 * 6
