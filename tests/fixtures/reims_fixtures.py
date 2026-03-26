"""Reusable pytest fixtures for Reims test data."""

import pytest

from app.mocks.yunicity_mock_service import (
    REIMS_ACTORS,
    REIMS_EVENTS,
    REIMS_TRIBES,
    SAMPLE_PASSPORT,
)
from app.models.yunicity import Actor, Event, Tribe, UserPassport


@pytest.fixture
def sample_user_passport() -> UserPassport:
    """A valid UserPassport for testing."""
    return SAMPLE_PASSPORT.model_copy()


@pytest.fixture
def reims_tribes() -> list[Tribe]:
    """The 5 Reims test tribes."""
    return list(REIMS_TRIBES)


@pytest.fixture
def reims_actors() -> list[Actor]:
    """The 6 Reims test actors."""
    return list(REIMS_ACTORS)


@pytest.fixture
def reims_events() -> list[Event]:
    """The 8 Reims test events."""
    return list(REIMS_EVENTS)
