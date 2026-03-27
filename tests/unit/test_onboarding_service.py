"""Unit tests for onboarding service (YAI-032)."""

from __future__ import annotations

import pytest

from app.services.onboarding_service import OnboardingService


@pytest.mark.asyncio
async def test_get_guide_reims_returns_8_steps() -> None:
    svc = OnboardingService()
    guide = await svc.get_guide("reims")
    assert guide.total_steps == 8
    assert len(guide.steps) == 8


@pytest.mark.asyncio
async def test_get_guide_unknown_city_generates_generic() -> None:
    svc = OnboardingService()
    guide = await svc.get_guide("marseille")
    assert guide.city == "marseille"
    assert guide.total_steps == 3


@pytest.mark.asyncio
async def test_voice_tour_step_0_is_introduction() -> None:
    svc = OnboardingService()
    text = await svc.get_voice_tour("reims", 0)
    assert "Bienvenue" in text
    assert "Reims" in text


@pytest.mark.asyncio
async def test_voice_tour_step_1_returns_first_step() -> None:
    svc = OnboardingService()
    text = await svc.get_voice_tour("reims", 1)
    assert "mairie" in text.lower()


@pytest.mark.asyncio
async def test_voice_tour_invalid_step_returns_message() -> None:
    svc = OnboardingService()
    text = await svc.get_voice_tour("reims", 99)
    assert "n'existe pas" in text


@pytest.mark.asyncio
async def test_guide_steps_have_voice_text() -> None:
    svc = OnboardingService()
    guide = await svc.get_guide("reims")
    for step in guide.steps:
        assert step.voice_text
        assert len(step.voice_text) > 10


@pytest.mark.asyncio
async def test_voice_tour_none_step_is_introduction() -> None:
    svc = OnboardingService()
    text = await svc.get_voice_tour("reims", None)
    assert "Bienvenue" in text
