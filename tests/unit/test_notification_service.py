"""Unit tests for NotificationService (YAI-038)."""

from __future__ import annotations

import pytest

from app.services.notification_service import (
    LEVEL_MESSAGES,
    NotificationService,
    NotificationType,
    PushNotification,
)


class _FakeRedis:
    def __init__(self, consent: bool = False, fcm_token: str | None = None) -> None:
        self._consent = consent
        self._fcm_token = fcm_token

    async def get(self, key: str) -> str | None:
        if "consent" in key:
            return "1" if self._consent else None
        if "fcm" in key:
            return self._fcm_token
        return None

    async def set(self, key: str, value: str, ttl_seconds: int = 0) -> None:
        pass


def _svc(consent: bool = False, fcm_token: str | None = None) -> NotificationService:
    svc = NotificationService(
        redis=_FakeRedis(consent=consent, fcm_token=fcm_token),  # type: ignore[arg-type]
    )
    return svc


@pytest.mark.asyncio
async def test_firebase_not_configured_returns_false() -> None:
    svc = _svc(consent=True, fcm_token="token")
    assert svc._firebase_ready is False
    notif = PushNotification(
        title="Test", body="Body",
        notification_type=NotificationType.BADGE_UNLOCKED,
    )
    result = await svc.send_to_user("user1", notif)
    assert result is False


@pytest.mark.asyncio
async def test_send_skipped_without_consent() -> None:
    svc = _svc(consent=False)
    svc._firebase_ready = True
    notif = PushNotification(
        title="Test", body="Body",
        notification_type=NotificationType.BADGE_UNLOCKED,
    )
    result = await svc.send_to_user("user1", notif)
    assert result is False


@pytest.mark.asyncio
async def test_send_skipped_without_fcm_token() -> None:
    svc = _svc(consent=True, fcm_token=None)
    svc._firebase_ready = True
    notif = PushNotification(
        title="Test", body="Body",
        notification_type=NotificationType.QUEST_AVAILABLE,
    )
    result = await svc.send_to_user("user1", notif)
    assert result is False


@pytest.mark.asyncio
async def test_notify_badge_includes_badge_name() -> None:
    svc = _svc(consent=True, fcm_token="token")
    await svc.notify_badge_unlocked("user1", "Decouvreur", "compass")


@pytest.mark.asyncio
async def test_notify_level_up_uses_correct_message() -> None:
    assert "Habitant" in LEVEL_MESSAGES["habitant"]
    assert "Ambassadeur" in LEVEL_MESSAGES["ambassadeur"]


@pytest.mark.asyncio
async def test_send_returns_false_when_firebase_not_ready() -> None:
    svc = _svc(consent=True, fcm_token="token")
    assert svc._firebase_ready is False
    notif = PushNotification(
        title="Err", body="Body",
        notification_type=NotificationType.EVENT_NEARBY,
    )
    result = await svc.send_to_user("user1", notif)
    assert result is False
