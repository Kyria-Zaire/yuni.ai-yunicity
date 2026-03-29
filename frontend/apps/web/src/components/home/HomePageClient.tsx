"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type {
  ActorRecommendation,
  EventRecommendation,
  VitalityIndexResponse,
} from "@yuni/api-client";
import {
  useQuests,
  useRecommendations,
  useVitality,
} from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import {
  SkeletonCard,
  VitalityGauge,
  YuniButton,
  YuniCard,
} from "@yuni/ui";

import { BreakingBanner } from "@/components/home/BreakingBanner";
import { HeroSection } from "@/components/home/HeroSection";
import { HeyYuniPanel } from "@/components/home/HeyYuniPanel";
import { LocalNewsSection } from "@/components/home/LocalNewsSection";
import type { NewsCardItem } from "@/components/home/NewsCard";
import { UpcomingEventsWidget } from "@/components/home/UpcomingEventsWidget";
import { VitalityIndexWidget } from "@/components/home/VitalityIndexWidget";
import type { VitalityZoneRow } from "@/components/home/VitalityIndexWidget";
import { DEFAULT_CITY, DEFAULT_GEO, DEFAULT_ZONE } from "@/lib/constants";

import type { MetricCardProps } from "./MetricCard";

function toError(e: unknown): Error | null {
  if (!e) return null;
  return e instanceof Error ? e : new Error(String(e));
}

function mapTrend(t: string | undefined): MetricCardProps["trend"] {
  const x = (t ?? "").toLowerCase();
  if (x.includes("down") || x.includes("neg") || x.includes("baisse")) {
    return "down";
  }
  if (x.includes("up") || x.includes("pos") || x.includes("hausse")) {
    return "up";
  }
  return "stable";
}

function zonesFromVitality(
  data: VitalityIndexResponse | undefined,
): VitalityZoneRow[] {
  if (!data) {
    return [{ name: "Centre-ville", score: 72 }];
  }
  const raw = data.dimensions;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ name: data.zone, score: Math.round(data.score) }];
  }
  const rows: VitalityZoneRow[] = [];
  for (const d of raw) {
    if (d && typeof d === "object" && "name" in d && "score" in d) {
      const o = d as Record<string, unknown>;
      const name = String(o.name);
      const score = Number(o.score);
      if (!Number.isNaN(score)) {
        rows.push({ name, score: Math.round(score) });
      }
    }
  }
  return rows.length > 0 ? rows.slice(0, 5) : [{ name: data.zone, score: Math.round(data.score) }];
}

function buildNewsItems(
  actors: ActorRecommendation[],
  events: EventRecommendation[],
): NewsCardItem[] {
  const fromActors = actors.slice(0, 3).map((a) => ({
    id: `actor-${a.id}`,
    title: a.name,
    category: a.category,
    meta: `${a.distance_km != null ? `${a.distance_km.toFixed(1)} km` : "—"} · score ${a.score.toFixed(2)}`,
    sentiment: { firstPct: 43 },
  }));
  const need = 3 - fromActors.length;
  const fromEvents = events.slice(0, Math.max(0, need)).map((e) => ({
    id: `event-${e.id}`,
    title: e.title,
    category: e.category,
    meta: "Événement · Yunicity",
    sentiment: { firstPct: 40 },
  }));
  return [...fromActors, ...fromEvents];
}

export function HomePageClient() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const vitality = useVitality(DEFAULT_CITY, DEFAULT_ZONE, isAuthenticated);
  const quests = useQuests(DEFAULT_CITY, undefined, isAuthenticated);
  const reco = useRecommendations(
    {
      user_id_hash: user?.hash ?? "0".repeat(64),
      city: DEFAULT_CITY,
      interests: ["culture", "sport"],
      points: 120,
      geo: DEFAULT_GEO,
    },
    isAuthenticated && Boolean(user?.hash),
  );

  const recoPayload = reco.data;
  const data =
    recoPayload &&
    "data" in recoPayload &&
    recoPayload.data &&
    "actors" in recoPayload.data
      ? recoPayload.data
      : null;

  const cards = [
    ...(data?.actors ?? []).slice(0, 3).map((a) => ({
      kind: "actor" as const,
      title: a.name,
      sub: a.category,
      score: a.score,
    })),
    ...(data?.events ?? [])
      .slice(0, Math.max(0, 3 - (data?.actors?.length ?? 0)))
      .map((e) => ({
        kind: "event" as const,
        title: e.title,
        sub: e.category,
        score: 0.9,
      })),
  ];

  const questPreview = (quests.data ?? []).slice(0, 2);

  const recoLoading =
    isAuthenticated && Boolean(user?.hash) && reco.isPending;
  const recoErr =
    isAuthenticated && reco.isError ? toError(reco.error) : null;
  const recoEmpty =
    isAuthenticated &&
    !reco.isPending &&
    !reco.isError &&
    cards.length === 0;

  const vitLoading = isAuthenticated && vitality.isPending;
  const vitErr =
    isAuthenticated && vitality.isError ? toError(vitality.error) : null;
  const vitEmpty =
    isAuthenticated &&
    !vitality.isPending &&
    !vitality.isError &&
    !vitality.data?.data;

  const questsLoading = isAuthenticated && quests.isPending;
  const questsErr =
    isAuthenticated && quests.isError ? toError(quests.error) : null;
  const questsEmpty =
    isAuthenticated &&
    !quests.isPending &&
    !quests.isError &&
    questPreview.length === 0;

  const vit = vitality.data?.data;
  const scoreRounded = vit ? Math.round(vit.score) : 78;
  const actorCount = (data?.actors?.length ?? 0) + (data?.events?.length ?? 0);
  const metrics: MetricCardProps[] = [
    {
      label: "Indice vitalité",
      value: String(scoreRounded),
      unit: "/ 100",
      trend: mapTrend(vit?.trend),
      color:
        (vit?.score ?? 78) >= 60
          ? "positive"
          : (vit?.score ?? 78) >= 40
            ? "neutral"
            : "negative",
    },
    {
      label: "Acteurs & événements",
      value: String(actorCount > 0 ? actorCount : 234),
      unit: "extraits",
      trend: "stable",
      color: "neutral",
    },
    {
      label: "Signalements",
      value: "12",
      unit: "cette semaine",
      trend: "down",
      color: "negative",
    },
    {
      label: "Quêtes actives",
      value: String((quests.data ?? []).length || 5),
      unit: "disponibles",
      trend: "up",
      color: "positive",
    },
  ];

  const cityLabel =
    DEFAULT_CITY.charAt(0).toUpperCase() + DEFAULT_CITY.slice(1);

  const newsItems = buildNewsItems(
    (data?.actors ?? []).slice(0, 6),
    (data?.events ?? []).slice(0, 6),
  );

  const showBreaking =
    isAuthenticated &&
    vit &&
    (vit.score < 45 || vit.trend.toLowerCase().includes("down"));

  const zones = zonesFromVitality(vit);

  return (
    <div className="bg-[var(--surface-page)]">
      {showBreaking ? (
        <BreakingBanner
          message="Signalement Reims Centre — Voirie dégradée rue Victor Hugo"
          timeLabel="Il y a 5 min"
        />
      ) : null}

      <HeroSection
        city={DEFAULT_CITY}
        cityLabel={cityLabel}
        metrics={metrics}
      />

      {!isAuthenticated ? (
        <p className="mx-auto max-w-7xl px-4 pb-6 text-center text-sm text-yuni-slate-600">
          <Link
            href="/login"
            className="font-medium underline decoration-yuni-terracotta-500/60"
          >
            Connecte-toi
          </Link>{" "}
          pour la vitalité live et les recommandations.
        </p>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <LocalNewsSection
              cityLabel={cityLabel}
              items={
                newsItems.length > 0
                  ? newsItems.slice(0, 3)
                  : [
                      {
                        id: "demo-1",
                        title: "Vie locale — en attente de données",
                        category: "Ville",
                        meta: `${cityLabel} · Yunicity`,
                      },
                      {
                        id: "demo-2",
                        title: "Connecte-toi pour charger le fil territorial",
                        category: "Info",
                        meta: "API recommandations",
                      },
                      {
                        id: "demo-3",
                        title: "Carte et quêtes disponibles dans le menu",
                        category: "Parcours",
                        meta: "Yuni AI",
                      },
                    ]
              }
              updatedLabel="Mis à jour à l’instant"
            />

            <section aria-labelledby="quests-heading">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2
                  id="quests-heading"
                  className="font-display text-2xl font-bold text-yuni-slate-900"
                >
                  Quêtes à la une
                </h2>
              </div>
              <hr className="mb-6 border-t-2 border-black" />
              <SkeletonCard
                isLoading={questsLoading}
                error={questsErr}
                empty={!isAuthenticated || questsEmpty}
                emptyMessage={
                  !isAuthenticated
                    ? "Connecte-toi pour voir les quêtes de la semaine."
                    : "Aucune quête pour cette ville pour le moment."
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {questPreview.map((q) => (
                    <YuniCard
                      key={q.id}
                      variant="elevated"
                      header={q.difficulty}
                      footer={
                        <span className="font-body font-bold text-yuni-terracotta-600">
                          ＋{q.xp_reward} XP · {q.estimated_duration}
                        </span>
                      }
                    >
                      <p className="line-clamp-2 font-body font-medium">
                        {q.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-yuni-slate-600">
                        {q.description}
                      </p>
                    </YuniCard>
                  ))}
                </div>
              </SkeletonCard>
              <div className="mt-6">
                <YuniButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => router.push("/quests")}
                >
                  Toutes les quêtes
                </YuniButton>
              </div>
            </section>

            <section aria-labelledby="reco-heading">
              <h2
                id="reco-heading"
                className="font-display text-2xl font-bold text-yuni-slate-900"
              >
                Pour toi
              </h2>
              <hr className="mb-6 mt-2 border-t border-yuni-wheat-200" />
              <SkeletonCard
                isLoading={recoLoading}
                error={recoErr}
                empty={!isAuthenticated || recoEmpty}
                emptyMessage={
                  !isAuthenticated
                    ? "Connecte-toi pour voir des recommandations personnalisées."
                    : "Aucune recommandation pour l’instant."
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {cards.map((c, i) => (
                    <YuniCard
                      key={`${c.kind}-${c.title}-${i}`}
                      variant="elevated"
                      header={c.kind === "actor" ? "Acteur" : "Événement"}
                    >
                      <div className="h-24 rounded-yuni-md bg-yuni-wheat-100" />
                      <p className="mt-2 font-body font-medium text-yuni-slate-900">
                        {c.title}
                      </p>
                      <p className="text-sm text-yuni-slate-500">{c.sub}</p>
                      <p className="mt-1 text-xs italic text-yuni-terracotta-700">
                        Score {c.score.toFixed(2)}
                      </p>
                    </YuniCard>
                  ))}
                </div>
              </SkeletonCard>
            </section>
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <VitalityIndexWidget
              score={vit ? Math.round(vit.score) : scoreRounded}
              zones={zones}
            />
            <HeyYuniPanel city={DEFAULT_CITY} />
            <UpcomingEventsWidget
              events={(data?.events ?? []).slice(0, 5).map((e) => ({
                id: e.id,
                title: e.title,
                category: e.category,
              }))}
            />

            <div className="border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
              <h3 className="font-display text-lg font-bold text-yuni-slate-900">
                Jauge territorial
              </h3>
              <SkeletonCard
                isLoading={vitLoading}
                error={vitErr}
                empty={!isAuthenticated || vitEmpty}
                emptyMessage={
                  !isAuthenticated
                    ? "Connecte-toi pour afficher la vitalité live."
                    : "Aucune donnée de vitalité pour le moment."
                }
              >
                <YuniCard variant="elevated" className="items-center text-center">
                  <div className="flex flex-col items-center gap-4">
                    {vitality.data?.data ? (
                      <VitalityGauge
                        score={vitality.data.data.score}
                        grade={vitality.data.data.grade}
                        trend={vitality.data.data.trend}
                      />
                    ) : null}
                    <p className="max-w-sm text-sm text-yuni-slate-600">
                      Score consolidé sur le centre-ville — {cityLabel}.
                    </p>
                  </div>
                </YuniCard>
              </SkeletonCard>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
