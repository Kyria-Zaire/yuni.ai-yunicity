"""Shared fixtures for recommendation tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.models.recommend import (
    ActorRecommendation,
    EventRecommendation,
    GeoInput,
    RecommendationOutput,
    TribeRecommendation,
    UserInput,
)
from app.models.yunicity import Actor, Event, MapData, Tribe, UserPassport

VALID_USER_ID_HASH = "a" * 64


def make_user_input(**overrides: object) -> UserInput:
    defaults = {
        "user_id_hash": VALID_USER_ID_HASH,
        "city": "reims",
        "interests": ["sport", "culture"],
        "points": 340,
        "geo": GeoInput(lat_truncated=49.25, lng_truncated=4.03),
    }
    defaults.update(overrides)
    return UserInput.model_validate(defaults)


def make_passport(**overrides: object) -> UserPassport:
    defaults = {
        "user_id_hash": VALID_USER_ID_HASH,
        "points": 340,
        "level": "citoyen",
        "badges": ["early-adopter"],
        "interests": ["sport", "culture"],
        "joined_at": datetime(2025, 6, 1, tzinfo=UTC),
    }
    defaults.update(overrides)
    return UserPassport.model_validate(defaults)


def make_map_data() -> MapData:
    return MapData(
        actors=[
            Actor(
                id="actor-1", name="Club Sport", category="sport",
                city="Reims", geo={"lat": 49.25, "lng": 4.03},
                description="Club de sport local", tags=["sport"],
            ),
            Actor(
                id="actor-2", name="MJC Culture", category="culture",
                city="Reims", geo={"lat": 49.26, "lng": 4.04},
                description="Maison de la culture", tags=["culture"],
            ),
        ],
        tribes=[
            Tribe(
                id="tribe-1", name="Sport Reims", city="Reims",
                category="sport", members_count=100, activity_score=8.0,
                description="Tribu sport",
            ),
        ],
        events=[
            Event(
                id="evt-1", title="Tournoi foot",
                actor_id="actor-1", city="Reims",
                date=datetime.now(UTC) + timedelta(days=3),
                category="sport", description="Tournoi",
            ),
            Event(
                id="evt-2", title="Concert jazz",
                actor_id="actor-2", city="Reims",
                date=datetime.now(UTC) + timedelta(days=5),
                category="culture", description="Concert",
            ),
        ],
        zone="reims-49.25-4.03",
    )


def make_recommendation_output(
    source: str = "yuni_ai_mistral",
) -> RecommendationOutput:
    return RecommendationOutput(
        actors=[
            ActorRecommendation(
                id="actor-1", name="Club Sport", category="sport",
                reason="Correspond a vos interets", score=0.9,
            ),
        ],
        tribes=[
            TribeRecommendation(
                id="tribe-1", name="Sport Reims", category="sport",
                members_count=100, reason="Tribu active", score=0.8,
            ),
        ],
        events=[
            EventRecommendation(
                id="evt-1", title="Tournoi foot", actor_id="actor-1",
                date=datetime.now(UTC) + timedelta(days=3),
                category="sport", reason="Evenement sportif proche",
            ),
        ],
        reason="Recommandations basees sur vos interets sportifs et culturels",
        source=source,
    )
