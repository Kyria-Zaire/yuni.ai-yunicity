"""Push notification service (Firebase FCM) with RGPD opt-in."""

from __future__ import annotations

import json
from enum import StrEnum
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.core.config import Settings
    from app.services.redis_service import RedisService

logger = get_logger("notifications")

CONSENT_TTL = 60 * 60 * 24 * 365  # 1 year


class NotificationType(StrEnum):
    QUEST_AVAILABLE = "quest_available"
    BADGE_UNLOCKED = "badge_unlocked"
    LEVEL_UP = "level_up"
    EVENT_NEARBY = "event_nearby"
    WEEKLY_DIGEST = "weekly_digest"


class PushNotification(BaseModel):
    title: str = Field(..., max_length=65)
    body: str = Field(..., max_length=240)
    notification_type: NotificationType
    data: dict[str, str] = Field(default_factory=dict)


LEVEL_MESSAGES: dict[str, str] = {
    "habitant": "Vous etes maintenant Habitant de votre ville !",
    "citoyen": "Vous devenez Citoyen actif !",
    "acteur": "Felicitations Acteur local !",
    "ambassadeur": "Vous etes Ambassadeur de votre ville !",
}


class NotificationService:
    """Sends push notifications via Firebase FCM with strict RGPD opt-in."""

    def __init__(self, redis: RedisService, settings: Settings | None = None) -> None:
        self._redis = redis
        self._firebase_ready = False

        if settings and settings.FIREBASE_CREDENTIALS_JSON:
            try:
                import firebase_admin
                from firebase_admin import credentials

                cred = credentials.Certificate(
                    json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                )
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self._firebase_ready = True
                logger.info("firebase_initialized")
            except Exception as exc:
                logger.warning("firebase_init_failed", error=str(exc))
        else:
            logger.info("firebase_not_configured_notifications_disabled")

    async def send_to_user(
        self,
        user_id_hash: str,
        notification: PushNotification,
    ) -> bool:
        if not self._firebase_ready:
            return False

        if not await self._has_consent(user_id_hash):
            logger.info(
                "notification_skipped_no_consent",
                type=notification.notification_type.value,
            )
            return False

        fcm_token = await self._get_fcm_token(user_id_hash)
        if not fcm_token:
            return False

        try:
            from firebase_admin import messaging

            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification.title,
                    body=notification.body,
                ),
                data={
                    "type": notification.notification_type.value,
                    **notification.data,
                },
                token=fcm_token,
            )
            import asyncio
            await asyncio.get_event_loop().run_in_executor(
                None, messaging.send, message,
            )
            logger.info(
                "notification_sent",
                type=notification.notification_type.value,
            )
            return True
        except Exception as exc:
            logger.warning("notification_failed", error=str(exc))
            return False

    async def notify_quest_available(
        self, user_id_hash: str, quest_title: str, xp_reward: int,
    ) -> None:
        await self.send_to_user(user_id_hash, PushNotification(
            title="Nouvelle quete disponible !",
            body=f"{quest_title} — Gagnez {xp_reward} XP",
            notification_type=NotificationType.QUEST_AVAILABLE,
            data={"xp_reward": str(xp_reward)},
        ))

    async def notify_badge_unlocked(
        self, user_id_hash: str, badge_name: str, badge_icon: str,
    ) -> None:
        await self.send_to_user(user_id_hash, PushNotification(
            title=f"Badge debloque : {badge_name}",
            body="Felicitations ! Continuez a explorer votre ville.",
            notification_type=NotificationType.BADGE_UNLOCKED,
            data={"badge_icon": badge_icon},
        ))

    async def notify_level_up(
        self, user_id_hash: str, new_level: str,
    ) -> None:
        body = LEVEL_MESSAGES.get(new_level, f"Niveau {new_level} atteint")
        await self.send_to_user(user_id_hash, PushNotification(
            title="Niveau superieur !",
            body=body,
            notification_type=NotificationType.LEVEL_UP,
            data={"new_level": new_level},
        ))

    async def _has_consent(self, user_id_hash: str) -> bool:
        key = f"notif:consent:{user_id_hash[:16]}"
        val = await self._redis.get(key)
        return val == "1"

    async def _get_fcm_token(self, user_id_hash: str) -> str | None:
        key = f"notif:fcm:{user_id_hash[:16]}"
        return await self._redis.get(key)
