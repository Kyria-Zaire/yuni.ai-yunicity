"""Intelligent Mistral model router — Large vs Small for cost optimization."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from app.core.exceptions import ExternalAPIError
from app.core.logging import get_logger
from app.core.metrics import metrics

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("mistral_router")


class TaskComplexity(StrEnum):
    SIMPLE = "simple"
    COMPLEX = "complex"


class MistralTaskType(StrEnum):
    SENTIMENT_ANALYSIS = "sentiment"
    QUEST_STEP_VALIDATION = "quest_step"
    REPORT_CATEGORIZATION = "report_cat"
    MERCHANT_SMS = "merchant_sms"
    ONBOARDING_STEP = "onboarding"
    RECOMMENDATION = "recommendation"
    CHAT_AGENT = "chat_agent"
    QUEST_GENERATION = "quest_gen"
    MERCHANT_NEWSLETTER = "newsletter"
    VITALITY_ANALYSIS = "vitality"
    SENTIMENT_DEEP = "sentiment_deep"


TASK_ROUTING: dict[MistralTaskType, TaskComplexity] = {
    MistralTaskType.SENTIMENT_ANALYSIS: TaskComplexity.SIMPLE,
    MistralTaskType.QUEST_STEP_VALIDATION: TaskComplexity.SIMPLE,
    MistralTaskType.REPORT_CATEGORIZATION: TaskComplexity.SIMPLE,
    MistralTaskType.MERCHANT_SMS: TaskComplexity.SIMPLE,
    MistralTaskType.ONBOARDING_STEP: TaskComplexity.SIMPLE,
}

MODEL_MAP: dict[TaskComplexity, str] = {
    TaskComplexity.SIMPLE: "mistral-small-latest",
    TaskComplexity.COMPLEX: "mistral-large-latest",
}

MODEL_COSTS: dict[str, tuple[float, float]] = {
    "mistral-small-latest": (0.2, 0.6),
    "mistral-large-latest": (3.0, 9.0),
}


class MistralRouter:
    """Routes tasks to the optimal Mistral model based on complexity."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    def get_model(self, task_type: MistralTaskType) -> str:
        complexity = TASK_ROUTING.get(task_type, TaskComplexity.COMPLEX)
        model = MODEL_MAP[complexity]
        logger.debug(
            "mistral_routing",
            task=task_type.value,
            complexity=complexity.value,
            model=model,
        )
        return model

    async def complete(
        self,
        task_type: MistralTaskType,
        messages: list[dict[str, str]],
        client: Any,
        max_tokens: int = 1000,
        temperature: float = 0.3,
    ) -> tuple[str, str]:
        model = self.get_model(task_type)
        timeout = 10.0 if model == "mistral-small-latest" else 15.0

        try:
            response = await asyncio.wait_for(
                client.chat.complete_async(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                ),
                timeout=timeout,
            )
            text: str = response.choices[0].message.content

            usage = getattr(response, "usage", None)
            if usage:
                input_t = getattr(usage, "prompt_tokens", 0)
                output_t = getattr(usage, "completion_tokens", 0)
                await self._track_usage(model, input_t, output_t)

            if model == "mistral-small-latest":
                metrics.record_mistral_small_call()
            else:
                metrics.record_mistral_large_call()

            return text, model

        except TimeoutError:
            if model == "mistral-small-latest":
                logger.warning(
                    "mistral_small_timeout_fallback_large",
                    task=task_type.value,
                )
                return await self.complete(
                    MistralTaskType.CHAT_AGENT,
                    messages, client, max_tokens, temperature,
                )
            raise ExternalAPIError("Mistral timeout") from None

    async def _track_usage(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> None:
        metrics.record_tokens(input_tokens, output_tokens)
        input_rate, output_rate = MODEL_COSTS.get(model, (3.0, 9.0))
        cost = (
            (input_tokens / 1_000_000) * input_rate
            + (output_tokens / 1_000_000) * output_rate
        )
        day = datetime.now(UTC).strftime("%Y-%m-%d")
        key = f"cost:model:{model}:{day}"
        try:
            existing = float(await self._redis.get(key) or 0)
            await self._redis.set(
                key, str(existing + cost), ttl_seconds=60 * 60 * 24 * 35,
            )
        except Exception as exc:
            logger.debug("cost_tracking_failed", error=str(exc))

    @staticmethod
    def estimate_savings(large_calls: int, small_calls: int) -> float:
        if large_calls + small_calls == 0:
            return 0.0
        total_if_all_large = (large_calls + small_calls) * 1.0
        actual = large_calls * 1.0 + small_calls * 0.067
        return round((1 - actual / total_if_all_large) * 100, 1) if total_if_all_large > 0 else 0.0
