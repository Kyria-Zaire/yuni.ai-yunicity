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
        self._latencies: deque[float] = deque(maxlen=max_samples)

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
        }


metrics = YuniAIMetrics()
