"""In-memory metrics for monitoring cache, latency, and service health."""

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
        self.fallback_calls: int = 0
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

    def record_fallback_call(self) -> None:
        with self._lock:
            self.fallback_calls += 1

    def record_latency(self, ms: float) -> None:
        with self._lock:
            self._latencies.append(ms)

    @property
    def cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return self.cache_hits / total if total > 0 else 0.0

    @property
    def p95_latency(self) -> float:
        with self._lock:
            if len(self._latencies) < 20:
                return 0.0
            sorted_l = sorted(self._latencies)
            idx = int(len(sorted_l) * 0.95)
            return sorted_l[min(idx, len(sorted_l) - 1)]

    def to_dict(self) -> dict[str, float]:
        return {
            "cache_hit_rate": round(self.cache_hit_rate, 4),
            "p95_latency_ms": round(self.p95_latency, 2),
            "cache_hits": float(self.cache_hits),
            "cache_misses": float(self.cache_misses),
            "mistral_calls": float(self.mistral_calls),
            "fallback_calls": float(self.fallback_calls),
        }


metrics = YuniAIMetrics()
