"""JWT validation and authentication utilities."""

from typing import Any

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import PyJWTError

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
            # Claims alignés sur le middleware Next + routes dashboard (`role=city_dashboard`).
            # Le corps du Bearer est ignoré tant qu’aucune clé publique n’est configurée.
            return {
                "sub": "dev-user",
                "env": "dev",
                "role": "city_dashboard",
                "city": "reims",
            }
        raise AuthenticationError("JWT public key not configured")

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=["RS256"],
        )
    except PyJWTError as exc:
        raise AuthenticationError(f"Invalid token: {exc}") from exc

    return payload
