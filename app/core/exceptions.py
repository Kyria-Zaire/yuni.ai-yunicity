"""Custom exception hierarchy for Yuni AI."""


class YuniAIError(Exception):
    """Base exception for all Yuni AI errors."""

    def __init__(self, detail: str = "An error occurred") -> None:
        self.detail = detail
        super().__init__(detail)


class WebhookBlockedError(YuniAIError):
    """Raised when a webhook is attempted outside production."""

    def __init__(self) -> None:
        super().__init__("Webhooks are blocked outside production environment")


class DataMutationBlockedError(YuniAIError):
    """Raised when a data mutation is blocked by environment guards."""

    def __init__(self) -> None:
        super().__init__("Data mutations are blocked in this environment")


class RateLimitError(YuniAIError):
    """Raised when a client exceeds the rate limit."""

    def __init__(self) -> None:
        super().__init__("Rate limit exceeded")


class AuthenticationError(YuniAIError):
    """Raised when JWT validation fails."""

    def __init__(self, detail: str = "Authentication failed") -> None:
        super().__init__(detail)


class ExternalAPIError(YuniAIError):
    """Raised when an external API call fails (Yunicity, Mistral, etc.)."""

    def __init__(self, service: str, detail: str = "") -> None:
        msg = f"External API error from {service}"
        if detail:
            msg += f": {detail}"
        self.service = service
        super().__init__(msg)
