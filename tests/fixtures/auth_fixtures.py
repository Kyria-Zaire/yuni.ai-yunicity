"""JWT fixtures for integration tests."""

from __future__ import annotations

import time
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt

_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public_key = _private_key.public_key()

TEST_RSA_PUBLIC_KEY = _public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode()

_PRIVATE_PEM = _private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode()


def create_test_jwt(
    *,
    expired: bool = False,
    invalid_signature: bool = False,
    payload_overrides: dict[str, Any] | None = None,
) -> str:
    """Generate an RS256-signed JWT for tests."""
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": "test-user-123",
        "iat": now,
        "exp": now - 3600 if expired else now + 3600,
        "env": "dev",
    }
    if payload_overrides:
        payload.update(payload_overrides)

    if invalid_signature:
        bad_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        bad_pem = bad_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode()
        return jwt.encode(payload, bad_pem, algorithm="RS256")

    return jwt.encode(payload, _PRIVATE_PEM, algorithm="RS256")
