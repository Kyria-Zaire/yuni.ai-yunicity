"use client";

import { useMemo, useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useYuniAIClient } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { VitalityGauge, YuniCard } from "@yuni/ui";

import { apiLoadErrorMessage } from "@/lib/api-query-errors";
import { DEFAULT_CITY, DEFAULT_GEO, DEFAULT_ZONE } from "@/lib/constants";

import type { RecommendationOutput } from "@yuni/api-client";

function sourceBadge(
  source: RecommendationOutput["source"],
): { label: string; className: string } {
  if (source === "yuni_ai_cache") {
    return { label: "Cache", className: "bg-yuni-slate-100 text-yuni-slate-700" };
  }
  if (source === "yuni_ai_mistral") {
    return { label: "IA", className: "bg-yuni-terracotta-100 text-yuni-terracotta-800" };
  }
  return { label: "Tendance locale", className: "bg-yuni-wheat-100 text-yuni-slate-700" };
}

export default function FeedPage() {
  const client = useYuniAIClient();
  const { user, isAuthenticated } = useAuth();
  const [interests, setInterests] = useState("culture,sport");

  const input = useMemo(
    () => ({
      user_id_hash: user?.hash ?? "0".repeat(64),
      city: DEFAULT_CITY,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      points: 120,
      geo: DEFAULT_GEO,
    }),
    [interests, user?.hash],
  );

  const infinite = useInfiniteQuery({
    queryKey: ["feed-reco", input],
    enabled: isAuthenticated && Boolean(user?.hash),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await client.getRecommendations({
        ...input,
        points: 120 + pageParam * 10,
      });
      return { page: pageParam, payload: res };
    },
    getNextPageParam: (last, _all, lastPageParam) =>
      lastPageParam < 2 ? lastPageParam + 1 : undefined,
  });

  const last = infinite.data?.pages[infinite.data.pages.length - 1]?.payload;
  const reco =
    last && "data" in last && last.data && "actors" in last.data
      ? last.data
      : null;

  const vitality = { score: 72, grade: "B" };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-12">
      <aside className="space-y-4 lg:col-span-3">
        <h2 className="font-editorial text-xl text-yuni-slate-900">Filtres</h2>
        <label className="block text-sm text-yuni-slate-600">
          Intérêts (CSV)
          <input
            className="mt-1 w-full rounded-yuni-md border border-yuni-wheat-100 px-2 py-2 text-sm"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </label>
        <p className="text-xs text-yuni-slate-500">
          Géoloc : tronquée côté client comme le backend (~1 km).
        </p>
      </aside>

      <section className="space-y-4 lg:col-span-6">
        <h1 className="font-editorial text-3xl text-yuni-slate-900">Feed</h1>
        {!isAuthenticated ? (
          <p className="text-sm text-yuni-slate-600">Connexion requise.</p>
        ) : infinite.isError ? (
          <p className="rounded-yuni-md border border-yuni-wheat-100 bg-yuni-wheat-50/80 p-4 text-sm text-yuni-slate-500">
            {apiLoadErrorMessage(infinite.error)}
          </p>
        ) : infinite.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-yuni-lg bg-yuni-wheat-100"
              />
            ))}
          </div>
        ) : (
          <>
            {reco?.actors.map((a) => {
              const b = reco
                ? sourceBadge(reco.source)
                : sourceBadge("yuni_ai_mistral");
              return (
                <YuniCard
                  key={a.id}
                  variant="elevated"
                  header={
                    <span className="flex items-center justify-between gap-2">
                      <span>{a.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${b.className}`}
                      >
                        {b.label}
                      </span>
                    </span>
                  }
                  footer={
                    <button
                      type="button"
                      className="text-sm font-medium text-yuni-terracotta-700 hover:underline"
                    >
                      J’y vais · Hey Yuni
                    </button>
                  }
                >
                  <p className="text-sm text-yuni-slate-600">{a.category}</p>
                  <p className="mt-1 text-xs text-yuni-slate-500">
                    {a.distance_km != null ? `${a.distance_km.toFixed(1)} km` : "—"}{" "}
                    · score {a.score.toFixed(2)}
                  </p>
                  <p className="mt-2 text-sm italic text-yuni-terracotta-800">
                    {a.reason}
                  </p>
                </YuniCard>
              );
            })}
            {reco?.events.map((e) => (
              <YuniCard key={e.id} variant="bordered" header="Événement">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-yuni-slate-600">{e.category}</p>
                <p className="mt-2 text-sm italic text-yuni-terracotta-800">
                  {e.reason}
                </p>
              </YuniCard>
            ))}
            <button
              type="button"
              className="w-full rounded-yuni-md border border-yuni-wheat-200 py-2 text-sm text-yuni-slate-700"
              onClick={() => infinite.fetchNextPage()}
              disabled={!infinite.hasNextPage || infinite.isFetchingNextPage}
            >
              {infinite.isFetchingNextPage ? "Chargement…" : "Charger plus"}
            </button>
          </>
        )}
      </section>

      <aside className="lg:col-span-3">
        <YuniCard header="Vitalité · zone">
          <div className="flex justify-center">
            <VitalityGauge score={vitality.score} grade={vitality.grade} />
          </div>
          <p className="mt-2 text-center text-xs text-yuni-slate-500">
            {DEFAULT_ZONE} — {DEFAULT_CITY}
          </p>
        </YuniCard>
      </aside>
    </div>
  );
}
