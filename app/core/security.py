"""JWT validation and authentication utilities."""

from typing import Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError

_bearer_scheme = HTTPBearer(auto_error=False)


async def verify_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Validate a JWT Bearer token and return its payload.

    Raises AuthenticationError if the token is missing, invalid, or expired.
    """
    if credentials is None:
        raise AuthenticationError("Missing authorization header")

    token = credentials.credentials

    if not settings.JWT_PUBLIC_KEY:
        if settings.is_dev:
            return {"sub": "dev-user", "env": "dev"}
        raise AuthenticationError("JWT public key not configured")

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=["RS256"],
        )
    except JWTError as exc:
        raise AuthenticationError(f"Invalid token: {exc}") from exc

    return payload
