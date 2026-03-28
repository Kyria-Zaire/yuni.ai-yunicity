import { describe, expect, it, vi } from "vitest";

import { YuniAIClient } from "./client";

describe("YuniAIClient", () => {
  it("getHealth parse la réponse JSON", async () => {
    const mockHealth = {
      status: "healthy",
      version: "2.0.0",
      environment: "dev",
      timestamp: "2026-01-01T00:00:00Z",
      services: { redis: "connected", qdrant: "not_configured", mistral: "available" },
      metrics: {
        cache_hit_rate: 0,
        cache_hits: 0,
        cache_misses: 0,
        mistral_calls: 0,
        mistral_errors: 0,
        fallback_calls: 0,
        error_rate: 0,
        p50_latency_ms: 0,
        p95_latency_ms: 0,
        estimated_cost_eur: 0,
        eligible_requests: 0,
        not_eligible_requests: 0,
        semantic_searches: 0,
        semantic_fallbacks: 0,
        voice_turns: 0,
        stt_calls: 0,
        tts_calls: 0,
        tts_cache_hits: 0,
        xp_awarded: 0,
        badges_unlocked: 0,
        quests_generated: 0,
        quests_completed: 0,
        mistral_large_calls: 0,
        mistral_small_calls: 0,
        semantic_cache_hits: 0,
        blackbox_records: 0,
        partner_requests: 0,
        federation_queries: 0,
        rollout_percentage: 10,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    }) as unknown as typeof fetch;

    const client = new YuniAIClient({
      baseUrl: "http://localhost:8000",
      getToken: () => null,
    });

    const res = await client.getHealth();
    expect(res.status).toBe("healthy");
    expect(res.version).toBe("2.0.0");
  });
});
