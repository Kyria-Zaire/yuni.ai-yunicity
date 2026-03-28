"""Unit tests for recommendation schemas (YAI-006)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.recommend import (
    GeoInput,
    RecommendationOutput,
    UserInput,
)
from tests.fixtures.recommend_fixtures import VALID_USER_ID_HASH, make_user_input


class TestUserInputValid:
    def test_user_input_valid_nominal(self) -> None:
        user = make_user_input()
        assert user.user_id_hash == VALID_USER_ID_HASH
        assert user.city == "reims"
        assert user.interests == ["sport", "culture"]
        assert user.points == 340

    def test_user_input_rejects_unknown_interest(self) -> None:
        with pytest.raises(ValidationError, match="Interet non reconnu"):
            make_user_input(interests=["sport", "blockchain"])

    def test_user_input_rejects_invalid_hash_format(self) -> None:
        with pytest.raises(ValidationError):
            make_user_input(user_id_hash="xyz123")

    def test_user_input_rejects_extra_fields(self) -> None:
        with pytest.raises(ValidationError, match="extra"):
            UserInput(
                user_id_hash=VALID_USER_ID_HASH,
                city="reims",
                interests=["sport"],
                points=100,
                geo=GeoInput(lat_truncated=49.25, lng_truncated=4.03),
                sneaky_field="oops",  # type: ignore[call-arg]
            )

    def test_user_input_rejects_points_negative(self) -> None:
        with pytest.raises(ValidationError):
            make_user_input(points=-10)


class TestGeoInput:
    def test_geo_input_rejects_invalid_lat(self) -> None:
        with pytest.raises(ValidationError):
            GeoInput(lat_truncated=91.0, lng_truncated=4.03)

    def test_geo_input_valid(self) -> None:
        geo = GeoInput(lat_truncated=49.25, lng_truncated=4.03)
        assert geo.lat_truncated == 49.25


class TestCacheKey:
    def test_cache_key_is_deterministic(self) -> None:
        u1 = make_user_input()
        u2 = make_user_input()
        assert u1.cache_key == u2.cache_key

    def test_cache_key_is_anonymous(self) -> None:
        user = make_user_input()
        assert user.user_id_hash not in user.cache_key

    def test_cache_key_uses_points_bucket(self) -> None:
        u340 = make_user_input(points=340)
        u399 = make_user_input(points=399)
        u400 = make_user_input(points=400)
        assert u340.cache_key == u399.cache_key
        assert u340.cache_key != u400.cache_key


class TestRecommendationOutput:
    def test_recommendation_output_limits_to_3_actors(self) -> None:
        actors = [
            {
                "id": f"a{i}", "name": f"Actor {i}", "category": "sport",
                "reason": "test", "score": 0.5,
            }
            for i in range(5)
        ]
        output = RecommendationOutput(
            actors=actors,  # type: ignore[arg-type]
            tribes=[],
            events=[],
            reason="test",
            source="yuni_ai_mistral",
        )
        assert len(output.actors) == 3

    def test_recommendation_output_valid_source_values(self) -> None:
        for src in ("yuni_ai_cache", "yuni_ai_mistral", "yuni_ai_fallback"):
            output = RecommendationOutput(
                actors=[], tribes=[], events=[],
                reason="test", source=src,  # type: ignore[arg-type]
            )
            assert output.source == src

    def test_recommendation_output_rejects_invalid_source(self) -> None:
        with pytest.raises(ValidationError):
            RecommendationOutput(
                actors=[], tribes=[], events=[],
                reason="test", source="invalid_source",  # type: ignore[arg-type]
            )
