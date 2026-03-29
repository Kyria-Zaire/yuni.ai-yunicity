"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

import { ActiveQuestsWidget } from "@/components/home/ActiveQuestsWidget";
import { BreakingBanner } from "@/components/home/BreakingBanner";
import { DailyQuestCard } from "@/components/home/DailyQuestCard";
import { HeyYuniPanel } from "@/components/home/HeyYuniPanel";
import { buildNewsItems, toError, zonesFromVitality } from "@/components/home/homeHelpers";
import { LocalNewsSection } from "@/components/home/LocalNewsSection";
import type { NewsCardItem } from "@/components/home/NewsCard";
import { NearbyEventsWidget } from "@/components/home/NearbyEventsWidget";
import { RecommendationsGrid, type RecoCard } from "@/components/home/RecommendationsGrid";
import { UpcomingEventsWidget } from "@/components/home/UpcomingEventsWidget";
import { XPBadge } from "@/components/home/XPBadge";
import { XPProgressWidget } from "@/components/home/XPProgressWidget";
import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY, DEFAULT_GEO, DEFAULT_ZONE } from "@/lib/constants";

export function CitizenHome() {
  const router = useRouter();
  const { user } = useAuth();
  const claims = useJwtClaims();
  const vitality = useVitality(DEFAULT_CITY, DEFAULT_ZONE, true);
  const quests = useQuests(DEFAULT_CITY, undefined, true);
  const reco = useRecommendations(
    {
      user_id_hash: user?.hash ?? "0".repeat(64),
      city: DEFAULT_CITY,
      interests: ["culture", "sport"],
      points: 120,
      geo: DEFAULT_GEO,
    },
    Boolean(user?.hash),
  );

  const recoPayload = reco.data;
  const data =
    recoPayload &&
    "data" in recoPayload &&
    recoPayload.data &&
    "actors" in recoPayload.data
      ? recoPayload.data
      : null;

  const cards: RecoCard[] = [
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

  const recoLoading = Boolean(user?.hash) && reco.isPending;
  const recoErr = reco.isError ? toError(reco.error) : null;
  const recoEmpty =
    !reco.isPending && !reco.isError && cards.length === 0;

  const vit = vitality.data?.data;
  const showBreaking =
    vit && (vit.score < 45 || vit.trend.toLowerCase().includes("down"));

  const zones = zonesFromVitality(vit);
  const newsItems: NewsCardItem[] = buildNewsItems(
    (data?.actors ?? []).slice(0, 6),
    (data?.events ?? []).slice(0, 6),
  );

  const cityLabel =
    DEFAULT_CITY.charAt(0).toUpperCase() + DEFAULT_CITY.slice(1);
  const zoneLabel = claims?.city
    ? `${claims.city.charAt(0).toUpperCase() + claims.city.slice(1)} · ${vit?.zone ?? DEFAULT_ZONE}`
    : `${cityLabel} · ${vit?.zone ?? DEFAULT_ZONE}`;

  const firstName = user?.email?.split("@")[0] ?? "toi";
  const dailyQuest = (quests.data ?? [])[0] ?? null;

  return (
    <div className="bg-[var(--surface-page)]">
      {showBreaking ? (
        <BreakingBanner
          message="Signalement Reims Centre — Voirie dégradée rue Victor Hugo"
          timeLabel="Il y a 5 min"
        />
      ) : null}

      <section className="bg-yuni-slate-900 px-4 py-6 text-white">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm text-yuni-slate-400">
              Bonjour {firstName} · {zoneLabel}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold">
              Ton aventure du jour
            </h1>
          </div>
          <XPBadge compact />
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 pb-16 pt-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <DailyQuestCard quest={dailyQuest} />

            <section>
              <h2 className="mb-1 font-display text-2xl font-bold text-yuni-slate-900">
                Pour toi aujourd’hui
              </h2>
              <hr className="mb-4 border-t-2 border-black" />
              <SkeletonCard
                isLoading={recoLoading}
                error={recoErr}
                empty={recoEmpty}
                emptyMessage="Aucune recommandation pour l’instant."
              >
                <RecommendationsGrid cards={cards} />
              </SkeletonCard>
            </section>

            <section>
              <h2 className="mb-1 font-display text-2xl font-bold text-yuni-slate-900">
                Dans ton quartier
              </h2>
              <hr className="mb-4 border-t-2 border-black" />
              <LocalNewsSection
                cityLabel={cityLabel}
                items={
                  newsItems.length > 0
                    ? newsItems.slice(0, 3)
                    : [
                        {
                          id: "c-1",
                          title: "Fil local — connecte les données",
                          category: "Info",
                          meta: zoneLabel,
                        },
                      ]
                }
                updatedLabel="Mis à jour à l’instant"
                filtered
              />
            </section>

            <div className="flex flex-wrap gap-3">
              <YuniButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => router.push("/quests")}
              >
                Toutes les quêtes
              </YuniButton>
              <Link
                href="/feed"
                className="inline-flex min-h-[44px] items-center rounded-yuni-md border border-yuni-slate-300 px-4 py-2 text-sm font-medium text-yuni-slate-800 hover:bg-yuni-wheat-50"
              >
                Ouvrir le feed
              </Link>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <HeyYuniPanel city={DEFAULT_CITY} mode="citizen" />
            <XPProgressWidget />
            <ActiveQuestsWidget />
            <NearbyEventsWidget events={(data?.events ?? []).slice(0, 8)} />
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
                isLoading={vitality.isPending}
                error={vitality.isError ? toError(vitality.error) : null}
                empty={!vitality.data?.data}
                emptyMessage="Aucune donnée de vitalité pour le moment."
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
                      Score consolidé — {cityLabel}
                      {zones.length > 0
                        ? ` · ${zones.map((z) => z.name).slice(0, 3).join(", ")}`
                        : ""}
                    </p>
                  </div>
                </YuniCard>
              </SkeletonCard>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
