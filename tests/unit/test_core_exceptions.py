"""Unit tests for custom exceptions."""

from app.core.exceptions import (
    AuthenticationError,
    DataMutationBlockedError,
    ExternalAPIError,
    RateLimitError,
    WebhookBlockedError,
    YuniAIError,
)


def test_base_exception_default_message() -> None:
    exc = YuniAIError()
    assert exc.detail == "An error occurred"


def test_base_exception_custom_message() -> None:
    exc = YuniAIError("custom error")
    assert exc.detail == "custom error"


def test_webhook_blocked_error() -> None:
    exc = WebhookBlockedError()
    assert "blocked" in exc.detail.lower()


def test_data_mutation_blocked_error() -> None:
    exc = DataMutationBlockedError()
    assert "blocked" in exc.detail.lower()


def test_rate_limit_error() -> None:
    exc = RateLimitError()
    assert "rate limit" in exc.detail.lower()


def test_authentication_error_default() -> None:
    exc = AuthenticationError()
    assert exc.detail == "Authentication failed"


def test_authentication_error_custom() -> None:
    exc = AuthenticationError("token expired")
    assert exc.detail == "token expired"


def test_external_api_error() -> None:
    exc = ExternalAPIError("mistral", "timeout")
    assert "mistral" in exc.detail
    assert "timeout" in exc.detail
    assert exc.service == "mistral"


def test_external_api_error_no_detail() -> None:
    exc = ExternalAPIError("yunicity")
    assert "yunicity" in exc.detail
