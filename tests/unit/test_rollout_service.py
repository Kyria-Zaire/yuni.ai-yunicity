"""Unit tests for RolloutService (YAI-012)."""

from __future__ import annotations

from unittest.mock import MagicMock

from app.services.rollout_service import RolloutService


def _make_settings(
    percentage: int = 10,
    cities: str = "reims",
    admin_token: str = "",
) -> MagicMock:
    settings = MagicMock()
    settings.ROLLOUT_PERCENTAGE = percentage
    settings.rollout_cities_list = [c.strip() for c in cities.split(",") if c.strip()]
    mock_secret = MagicMock()
    mock_secret.get_secret_value.return_value = admin_token
    settings.ADMIN_BYPASS_TOKEN = mock_secret
    return settings


def _make_request(headers: dict[str, str] | None = None) -> MagicMock:
    request = MagicMock()
    request.headers = headers or {}
    return request


class TestRolloutPercentage:
    def test_100_percent_always_eligible(self) -> None:
        svc = RolloutService(_make_settings(percentage=100))
        for i in range(50):
            h = f"{i:064x}"
            assert svc.is_eligible(h, "reims", _make_request())

    def test_0_percent_never_eligible(self) -> None:
        svc = RolloutService(_make_settings(percentage=0))
        for i in range(50):
            h = f"{i:064x}"
            assert not svc.is_eligible(h, "reims", _make_request())

    def test_deterministic_same_hash_same_result(self) -> None:
        svc = RolloutService(_make_settings(percentage=50))
        h = "a" * 64
        results = [svc.is_eligible(h, "reims", _make_request()) for _ in range(100)]
        assert len(set(results)) == 1

    def test_deterministic_10_percent_correct_ratio(self) -> None:
        import hashlib
        svc = RolloutService(_make_settings(percentage=10))
        eligible = sum(
            svc.is_eligible(
                hashlib.sha256(str(i).encode()).hexdigest(),
                "reims",
                _make_request(),
            )
            for i in range(1000)
        )
        assert 70 <= eligible <= 130, f"Expected ~100, got {eligible}"


class TestCityFilter:
    def test_city_filter_blocks_non_configured_city(self) -> None:
        svc = RolloutService(_make_settings(percentage=100, cities="reims"))
        assert not svc.is_eligible("a" * 64, "paris", _make_request())

    def test_city_filter_allows_configured_city(self) -> None:
        svc = RolloutService(_make_settings(percentage=100, cities="reims"))
        assert svc.is_eligible("a" * 64, "reims", _make_request())

    def test_city_filter_case_insensitive(self) -> None:
        svc = RolloutService(_make_settings(percentage=100, cities="reims"))
        assert svc.is_eligible("a" * 64, "Reims", _make_request())


class TestAdminBypass:
    def test_admin_bypass_header_overrides_percentage(self) -> None:
        svc = RolloutService(_make_settings(percentage=0, admin_token="secret"))
        req = _make_request({"X-Yuni-Admin": "secret"})
        assert svc.is_eligible("a" * 64, "paris", req)

    def test_admin_bypass_requires_correct_token(self) -> None:
        svc = RolloutService(_make_settings(percentage=0, admin_token="secret"))
        req = _make_request({"X-Yuni-Admin": "wrong"})
        assert not svc.is_eligible("a" * 64, "reims", req)

    def test_admin_bypass_empty_token_not_eligible(self) -> None:
        svc = RolloutService(_make_settings(percentage=0, admin_token=""))
        req = _make_request({"X-Yuni-Admin": ""})
        assert not svc.is_eligible("a" * 64, "reims", req)
