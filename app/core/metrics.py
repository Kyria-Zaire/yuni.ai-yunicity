"""In-memory metrics for monitoring cache, latency, cost, and rollout."""

from __future__ import annotations

import threading
from collections import deque


class YuniAIMetrics:
    """Thread-safe in-memory metrics collector."""

    def __init__(self, max_samples: int = 1000) -> None:
        self._lock = threading.Lock()
        self.cache_hits: int = 0
        self.cache_misses: int = 0
        self.mistral_calls: int = 0
        self.mistral_errors: int = 0
        self.fallback_calls: int = 0
        self.eligible_requests: int = 0
        self.not_eligible_requests: int = 0
        self.mistral_tokens_input: int = 0
        self.mistral_tokens_output: int = 0
        self.semantic_searches: int = 0
        self.semantic_fallbacks: int = 0
        self.voice_turns: int = 0
        self.stt_calls: int = 0
        self.tts_calls: int = 0
        self.tts_cache_hits: int = 0
        self.xp_awarded: int = 0
        self.badges_unlocked: int = 0
        self.quests_generated: int = 0
        self.quests_completed: int = 0
        self.mistral_large_calls: int = 0
        self.mistral_small_calls: int = 0
        self.semantic_cache_hits: int = 0
        self._latencies: deque[float] = deque(maxlen=max_samples)
        self._pipeline_latencies: deque[float] = deque(maxlen=max_samples)

    def record_cache_hit(self) -> None:
        with self._lock:
            self.cache_hits += 1

    def record_cache_miss(self) -> None:
        with self._lock:
            self.cache_misses += 1

    def record_mistral_call(self) -> None:
        with self._lock:
            self.mistral_calls += 1

    def record_mistral_error(self) -> None:
        with self._lock:
            self.mistral_errors += 1

    def record_fallback_call(self) -> None:
        with self._lock:
            self.fallback_calls += 1

    def record_eligible(self) -> None:
        with self._lock:
            self.eligible_requests += 1

    def record_not_eligible(self) -> None:
        with self._lock:
            self.not_eligible_requests += 1

    def record_tokens(self, input_tokens: int, output_tokens: int) -> None:
        with self._lock:
            self.mistral_tokens_input += input_tokens
            self.mistral_tokens_output += output_tokens

    def record_semantic_search(self) -> None:
        with self._lock:
            self.semantic_searches += 1

    def record_semantic_fallback(self) -> None:
        with self._lock:
            self.semantic_fallbacks += 1

    def record_voice_turn(self) -> None:
        with self._lock:
            self.voice_turns += 1

    def record_stt_call(self) -> None:
        with self._lock:
            self.stt_calls += 1

    def record_tts_call(self) -> None:
        with self._lock:
            self.tts_calls += 1

    def record_tts_cache_hit(self) -> None:
        with self._lock:
            self.tts_cache_hits += 1

    def record_xp_awarded(self) -> None:
        with self._lock:
            self.xp_awarded += 1

    def record_badge_unlocked(self) -> None:
        with self._lock:
            self.badges_unlocked += 1

    def record_quest_generated(self) -> None:
        with self._lock:
            self.quests_generated += 1

    def record_quest_completed(self) -> None:
        with self._lock:
            self.quests_completed += 1

    def record_mistral_large_call(self) -> None:
        with self._lock:
            self.mistral_large_calls += 1

    def record_mistral_small_call(self) -> None:
        with self._lock:
            self.mistral_small_calls += 1

    def record_semantic_cache_hit(self) -> None:
        with self._lock:
            self.semantic_cache_hits += 1

    def record_pipeline_latency(self, ms: float) -> None:
        with self._lock:
            self._pipeline_latencies.append(ms)

    def record_latency(self, ms: float) -> None:
        with self._lock:
            self._latencies.append(ms)

    @property
    def cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return round(self.cache_hits / total, 4) if total > 0 else 0.0

    @property
    def error_rate(self) -> float:
        total = self.mistral_calls
        return round(self.mistral_errors / total, 4) if total > 0 else 0.0

    @property
    def p50_latency(self) -> float:
        with self._lock:
            if len(self._latencies) < 10:
                return 0.0
            sorted_l = sorted(self._latencies)
            return sorted_l[int(len(sorted_l) * 0.50)]

    @property
    def p95_latency(self) -> float:
        with self._lock:
            if len(self._latencies) < 20:
                return 0.0
            sorted_l = sorted(self._latencies)
            idx = int(len(sorted_l) * 0.95)
            return sorted_l[min(idx, len(sorted_l) - 1)]

    @property
    def estimated_mistral_cost_eur(self) -> float:
        input_cost = (self.mistral_tokens_input / 1_000_000) * 3.0
        output_cost = (self.mistral_tokens_output / 1_000_000) * 9.0
        return round(input_cost + output_cost, 4)

    def to_dict(self) -> dict[str, float]:
        return {
            "cache_hit_rate": self.cache_hit_rate,
            "cache_hits": float(self.cache_hits),
            "cache_misses": float(self.cache_misses),
            "mistral_calls": float(self.mistral_calls),
            "mistral_errors": float(self.mistral_errors),
            "fallback_calls": float(self.fallback_calls),
            "error_rate": self.error_rate,
            "p50_latency_ms": round(self.p50_latency, 2),
            "p95_latency_ms": round(self.p95_latency, 2),
            "estimated_cost_eur": self.estimated_mistral_cost_eur,
            "eligible_requests": float(self.eligible_requests),
            "not_eligible_requests": float(self.not_eligible_requests),
            "semantic_searches": float(self.semantic_searches),
            "semantic_fallbacks": float(self.semantic_fallbacks),
            "voice_turns": float(self.voice_turns),
            "stt_calls": float(self.stt_calls),
            "tts_calls": float(self.tts_calls),
            "tts_cache_hits": float(self.tts_cache_hits),
            "xp_awarded": float(self.xp_awarded),
            "badges_unlocked": float(self.badges_unlocked),
            "quests_generated": float(self.quests_generated),
            "quests_completed": float(self.quests_completed),
            "mistral_large_calls": float(self.mistral_large_calls),
            "mistral_small_calls": float(self.mistral_small_calls),
            "semantic_cache_hits": float(self.semantic_cache_hits),
        }


metrics = YuniAIMetrics()
