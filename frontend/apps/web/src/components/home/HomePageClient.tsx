"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import {
  useQuests,
  useRecommendations,
  useVitality,
} from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { VitalityGauge, YuniCard } from "@yuni/ui";

import { HeyYuniWeb } from "@/components/voice/HeyYuniWeb";
import { apiLoadErrorMessage } from "@/lib/api-query-errors";
import { DEFAULT_CITY, DEFAULT_GEO, DEFAULT_ZONE } from "@/lib/constants";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

export function HomePageClient() {
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
    ...(data?.events ?? []).slice(0, Math.max(0, 3 - (data?.actors?.length ?? 0))).map((e) => ({
      kind: "event" as const,
      title: e.title,
      sub: e.category,
      score: 0.9,
    })),
  ];

  const questPreview = (quests.data ?? []).slice(0, 2);

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

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center">
        <motion.h1
          custom={0}
          initial="hidden"
          animate="show"
          variants={fade}
          className="font-editorial text-4xl leading-tight text-yuni-slate-900 md:text-5xl"
        >
          Yuni connaît ta ville.
        </motion.h1>
        <motion.p
          custom={1}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-4 text-lg text-yuni-slate-600"
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
            <Link href="/login" className="underline">
              Connecte-toi
            </Link>{" "}
            pour la vitalité live et les recommandations.
          </motion.p>
        ) : null}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-center font-editorial text-2xl text-yuni-slate-800">
          Vitalité en temps réel — Reims
        </h2>
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          {isAuthenticated && vitality.isError ? (
            <YuniCard className="w-full max-w-md">
              <p className="text-sm text-yuni-slate-500">
                {apiLoadErrorMessage(vitality.error)}
              </p>
            </YuniCard>
          ) : vitality.data?.data ? (
            <>
              <VitalityGauge
                score={vitality.data.data.score}
                grade={vitality.data.data.grade}
              />
              <div className="text-center md:text-left">
                <p className="text-sm uppercase tracking-wide text-yuni-slate-500">
                  Tendance
                </p>
                <p className="text-lg font-medium text-yuni-forest-700">
                  {vitality.data.data.trend}
                </p>
                <p className="mt-2 max-w-sm text-yuni-slate-600">
                  Votre ville est vivante — score consolidé sur le centre-ville.
                </p>
              </div>
            </>
          ) : (
            <YuniCard className="w-full max-w-md">
              <p className="text-sm text-yuni-slate-600">
                {isAuthenticated
                  ? vitality.isPending
                    ? "Chargement de la vitalité…"
                    : "Aucune donnée de vitalité pour le moment."
                  : "Connecte-toi pour afficher la vitalité live."}
              </p>
            </YuniCard>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-center font-editorial text-2xl text-yuni-slate-800">
          Pour toi
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {isAuthenticated && reco.isError ? (
            <div className="md:col-span-3 rounded-yuni-md border border-yuni-wheat-100 bg-yuni-wheat-50/80 p-4 text-sm text-yuni-slate-500">
              {apiLoadErrorMessage(reco.error)}
            </div>
          ) : cards.length > 0 ? (
            cards.map((c, i) => (
              <YuniCard
                key={`${c.kind}-${c.title}-${i}`}
                variant="elevated"
                header={c.kind === "actor" ? "Acteur" : "Événement"}
              >
                <div className="h-24 rounded-yuni-md bg-yuni-wheat-100" />
                <p className="mt-2 font-medium text-yuni-slate-900">
                  {c.title}
                </p>
                <p className="text-sm text-yuni-slate-500">{c.sub}</p>
                <p className="mt-1 text-xs italic text-yuni-terracotta-700">
                  Score {c.score.toFixed(2)}
                </p>
              </YuniCard>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <YuniCard key={i} variant="bordered">
                <div className="h-24 animate-pulse rounded-yuni-md bg-yuni-wheat-100" />
                <p className="mt-2 text-sm text-yuni-slate-500">
                  {isAuthenticated
                    ? reco.isPending
                      ? "Chargement…"
                      : "Aucune recommandation pour l’instant."
                    : "Connexion requise pour les recommandations."}
                </p>
              </YuniCard>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-center font-editorial text-2xl text-yuni-slate-800">
          Quêtes de la semaine
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {questPreview.map((q) => (
            <YuniCard
              key={q.id}
              variant="elevated"
              header={q.difficulty}
              footer={
                <span className="text-yuni-forest-700">
                  +{q.xp_reward} XP · {q.estimated_duration}
                </span>
              }
            >
              <p className="line-clamp-2 font-medium">{q.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-yuni-slate-600">
                {q.description}
              </p>
            </YuniCard>
          ))}
          {isAuthenticated && quests.isError ? (
            <p className="text-sm text-yuni-slate-500">
              {apiLoadErrorMessage(quests.error)}
            </p>
          ) : questPreview.length === 0 ? (
            <p className="text-sm text-yuni-slate-500">
              {isAuthenticated
                ? quests.isPending
                  ? "Chargement des quêtes…"
                  : "Aucune quête pour cette ville pour le moment."
                : "Connecte-toi pour voir les quêtes."}
            </p>
          ) : null}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/quests"
            className="inline-flex h-10 items-center justify-center rounded-yuni-md border border-yuni-slate-200 bg-white px-4 text-sm font-medium text-yuni-slate-800 shadow-yuni-sm hover:bg-yuni-wheat-50"
          >
            Toutes les quêtes
          </Link>
        </div>
      </section>

      <footer className="border-t border-yuni-wheat-100 bg-yuni-wheat-50/80 py-10">
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
