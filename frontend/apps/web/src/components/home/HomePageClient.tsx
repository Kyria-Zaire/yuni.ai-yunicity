"use client";

import { motion } from "framer-motion";
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

import { HeyYuniWeb } from "@/components/voice/HeyYuniWeb";
import { DEFAULT_CITY, DEFAULT_GEO, DEFAULT_ZONE } from "@/lib/constants";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

function toError(e: unknown): Error | null {
  if (!e) return null;
  return e instanceof Error ? e : new Error(String(e));
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

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute left-[10%] top-20 h-2 w-2 animate-pulse rounded-full bg-yuni-terracotta-300" />
        <div className="absolute right-[15%] top-40 h-1.5 w-1.5 animate-pulse rounded-full bg-yuni-terracotta-500 delay-150" />
        <div className="absolute left-[30%] bottom-32 h-1 w-1 animate-pulse rounded-full bg-yuni-slate-300 delay-300" />
      </div>

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-12 text-center">
        <motion.h1
          custom={0}
          initial="hidden"
          animate="show"
          variants={fade}
          className="font-editorial text-4xl font-semibold leading-tight text-yuni-slate-900 md:text-[56px]"
        >
          Ta ville{" "}
          <span className="italic text-yuni-terracotta-500">te reconnaît</span>.
        </motion.h1>
        <motion.p
          custom={1}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-4 font-body text-lg text-yuni-slate-500"
        >
          Recommandations · Voix · Vitalité · Quêtes
        </motion.p>
        <motion.div
          custom={2}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-10"
        >
          <HeyYuniWeb city={DEFAULT_CITY} />
        </motion.div>
        {!isAuthenticated ? (
          <motion.p
            custom={3}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-6 text-sm text-yuni-slate-500"
          >
            <Link href="/login" className="underline decoration-yuni-terracotta-500/60">
              Connecte-toi
            </Link>{" "}
            pour la vitalité live et les recommandations.
          </motion.p>
        ) : null}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-8 text-center font-editorial text-2xl text-yuni-slate-800">
          Vitalité en temps réel — Reims
        </h2>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-7">
            <h3 className="font-editorial text-xl text-yuni-slate-900">
              Pour toi
            </h3>
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
          </div>

          <div className="lg:col-span-5">
            <h3 className="mb-4 text-center font-editorial text-xl text-yuni-slate-900 lg:text-left">
              Vitalité
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
                    Votre ville est vivante — score consolidé sur le centre-ville.
                  </p>
                </div>
              </YuniCard>
            </SkeletonCard>
          </div>

          <div className="lg:col-span-12">
            <h3 className="mb-4 font-editorial text-xl text-yuni-slate-900">
              Quêtes actives
            </h3>
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
                      <span className="font-body font-bold text-yuni-terracotta-500">
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
            <div className="mt-6 text-center">
              <YuniButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => router.push("/quests")}
              >
                Toutes les quêtes
              </YuniButton>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-yuni-wheat-300/60 bg-yuni-wheat-50/80 py-10">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6 px-6 text-sm text-yuni-slate-600">
          <span>À propos</span>
          <span>RGPD</span>
          <span>EU AI Act</span>
          <span>Contact</span>
        </div>
      </footer>
    </div>
  );
}
