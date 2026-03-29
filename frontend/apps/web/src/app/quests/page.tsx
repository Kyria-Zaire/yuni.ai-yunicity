"use client";

import Link from "next/link";
import { useState } from "react";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import type { Quest, QuestDifficulty, UserQuestProgress } from "@yuni/api-client";
import { useQuests, useYuniAIClient } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { YuniButton, YuniCard } from "@yuni/ui";

import { apiLoadErrorMessage } from "@/lib/api-query-errors";
import { DEFAULT_CITY } from "@/lib/constants";

const diffBadge: Record<QuestDifficulty, string> = {
  easy: "bg-yuni-forest-50 text-yuni-forest-700 ring-1 ring-yuni-forest-300",
  medium: "bg-yuni-slate-50 text-yuni-slate-700 ring-1 ring-yuni-slate-200",
  hard: "bg-yuni-terracotta-50 text-yuni-terracotta-700 ring-1 ring-yuni-terracotta-200",
  epic: "bg-yuni-slate-900 text-yuni-wheat-50 ring-1 ring-yuni-slate-900",
};

const diffBorder: Record<QuestDifficulty, string> = {
  easy: "border-l-yuni-forest-500",
  medium: "border-l-yuni-slate-500",
  hard: "border-l-yuni-terracotta-500",
  epic: "border-l-yuni-slate-900",
};

const QUEST_PREVIEWS: {
  id: string;
  title: string;
  difficulty: QuestDifficulty;
  xp_reward: number;
}[] = [
  {
    id: "preview-1",
    title: "Découvrir le vieux Reims",
    difficulty: "easy",
    xp_reward: 20,
  },
  {
    id: "preview-2",
    title: "Circuit champagne",
    difficulty: "medium",
    xp_reward: 50,
  },
  {
    id: "preview-3",
    title: "Nuit blanche citoyenne",
    difficulty: "hard",
    xp_reward: 100,
  },
];

function QuestPreviewCard({
  title,
  difficulty,
  xp_reward,
}: {
  title: string;
  difficulty: QuestDifficulty;
  xp_reward: number;
}) {
  return (
    <YuniCard
      variant="elevated"
      className={`border-l-[3px] opacity-60 ${diffBorder[difficulty]}`}
      header={
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-body font-medium capitalize ${diffBadge[difficulty]}`}
        >
          {difficulty}
        </span>
      }
      footer={
        <span className="font-body font-bold text-yuni-terracotta-500">
          ＋{xp_reward} XP
        </span>
      }
    >
      <p className="line-clamp-2 font-editorial text-lg font-semibold text-yuni-slate-900">
        {title}
      </p>
      <p className="mt-2 text-xs text-yuni-slate-400">Aperçu — connecte-toi</p>
    </YuniCard>
  );
}

function QuestIllustration({ category }: { category: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-yuni-md bg-gradient-to-br from-yuni-wheat-100 to-yuni-terracotta-50">
      <svg viewBox="0 0 120 80" className="h-16 w-24 opacity-80" aria-hidden>
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#C1440E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4A6FA5" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect width="120" height="80" rx="12" fill="url(#g)" />
        <text
          x="60"
          y="45"
          textAnchor="middle"
          className="fill-yuni-slate-700 text-[10px] font-medium"
        >
          {category}
        </text>
      </svg>
    </div>
  );
}

function QuestsEmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-4xl mb-4">🗺️</p>
      <p className="font-display text-2xl text-yuni-slate-700">
        Aucune quête active cette semaine
      </p>
      <p className="text-yuni-slate-500 mt-2">
        Les nouvelles quêtes arrivent chaque lundi
      </p>
    </div>
  );
}

function QuestInProgressPanel({
  entries,
  onCompleteStep,
  busyQuestId,
}: {
  entries: { quest: Quest; progress: UserQuestProgress }[];
  onCompleteStep: (questId: string, stepOrder: number) => void;
  busyQuestId: string | null;
}) {
  return (
    <div className="mt-4 space-y-8">
      {entries.map(({ quest, progress }) => {
        const sorted = [...quest.steps].sort((a, b) => a.order - b.order);
        const nextStep = sorted.find((s) => s.order > progress.current_step);

        return (
          <div
            key={quest.id}
            className="rounded-yuni-lg border border-yuni-wheat-100 bg-yuni-wheat-50/40 p-4"
          >
            <p className="font-editorial text-lg font-semibold text-yuni-slate-900">
              {quest.title}
            </p>
            <ul className="mt-3 space-y-2">
              {sorted.map((s) => {
                const done = s.order <= progress.current_step;
                return (
                  <li
                    key={s.order}
                    className="flex items-start gap-2 text-sm text-yuni-slate-700"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        done
                          ? "bg-yuni-forest-500 text-white"
                          : "bg-yuni-wheat-100 text-yuni-slate-600"
                      }`}
                    >
                      {s.order}
                    </span>
                    <span className="line-clamp-2">{s.description}</span>
                  </li>
                );
              })}
            </ul>
            {nextStep ? (
              <div className="mt-4">
                <YuniButton
                  size="sm"
                  loading={busyQuestId === quest.id}
                  onClick={() => onCompleteStep(quest.id, nextStep.order)}
                >
                  Valider l&apos;étape {nextStep.order}
                </YuniButton>
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-yuni-forest-600">
                Quête terminée — bravo !
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QuestsPage() {
  const client = useYuniAIClient();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const quests = useQuests(DEFAULT_CITY, undefined, isAuthenticated);
  const questList = quests.data ?? [];

  const progressQueries = useQueries({
    queries: questList.map((q) => ({
      queryKey: ["quest-progress", DEFAULT_CITY, q.id] as const,
      queryFn: () => client.getQuestProgress(DEFAULT_CITY, q.id),
      enabled:
        isAuthenticated &&
        questList.length > 0 &&
        !quests.isLoading &&
        Boolean(quests.isSuccess),
    })),
  });

  const inProgressEntries = questList
    .map((quest, i) => {
      const row = progressQueries[i];
      const p = row?.data;
      if (!p || p.status !== "in_progress") {
        return null;
      }
      return { quest, progress: p };
    })
    .filter(
      (x): x is { quest: Quest; progress: UserQuestProgress } => x != null,
    );

  const invalidateQuestCaches = () => {
    void qc.invalidateQueries({ queryKey: ["quests", DEFAULT_CITY] });
    void qc.invalidateQueries({ queryKey: ["quest-progress", DEFAULT_CITY] });
  };

  const start = useMutation({
    mutationFn: (questId: string) =>
      client.startQuest(DEFAULT_CITY, questId),
    onSuccess: () => {
      invalidateQuestCaches();
    },
  });

  const progressMut = useMutation({
    mutationFn: ({
      questId,
      step,
    }: {
      questId: string;
      step: number;
    }) => client.completeQuestStep(DEFAULT_CITY, questId, step),
    onSuccess: async () => {
      invalidateQuestCaches();
      const mod = await import("canvas-confetti");
      mod.default({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-5xl" aria-hidden>
          🗺️
        </p>
        <h2 className="mt-6 font-display text-3xl font-bold text-yuni-slate-900">
          Des quêtes t&apos;attendent à Reims
        </h2>
        <p className="mx-auto mt-4 max-w-md text-yuni-slate-600">
          Connecte-toi pour débloquer tes quêtes urbaines et gagner de l&apos;XP en
          explorant ta ville.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block min-h-[44px] rounded-yuni-sm bg-yuni-terracotta-500 px-8 py-3 font-body font-semibold text-white transition-colors hover:bg-yuni-terracotta-700"
        >
          Se connecter
        </Link>
        <div className="pointer-events-none mx-auto mt-10 grid max-w-3xl select-none grid-cols-1 gap-4 opacity-60 md:grid-cols-3">
          {QUEST_PREVIEWS.map((q) => (
            <QuestPreviewCard
              key={q.id}
              title={q.title}
              difficulty={q.difficulty}
              xp_reward={q.xp_reward}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-yuni-slate-900">
            Quêtes de la semaine
          </h1>
          <p className="text-sm text-yuni-slate-600">
            XP disponible sur la fiche profil
          </p>
        </div>
      </header>

      {quests.isError ? (
        <p className="rounded-yuni-md border border-yuni-wheat-100 bg-yuni-wheat-50/80 p-4 text-sm text-yuni-slate-500">
          {apiLoadErrorMessage(quests.error)}
        </p>
      ) : quests.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-yuni-lg bg-yuni-wheat-100"
            />
          ))}
        </div>
      ) : questList.length === 0 ? (
        <QuestsEmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {questList.map((q: Quest) => (
            <YuniCard
              key={q.id}
              variant="elevated"
              className={`border-l-[3px] ${diffBorder[q.difficulty]}`}
              header={
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-body font-medium capitalize ${diffBadge[q.difficulty]}`}
                >
                  {q.difficulty}
                </span>
              }
              footer={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body font-bold text-yuni-terracotta-500">
                    ＋{q.xp_reward} XP · {q.estimated_duration}
                  </span>
                  <YuniButton
                    size="sm"
                    onClick={() => setConfirmId(q.id)}
                    loading={start.isPending && confirmId === q.id}
                  >
                    Démarrer
                  </YuniButton>
                </div>
              }
            >
              <QuestIllustration category={q.category} />
              <p className="mt-3 line-clamp-2 font-editorial text-[22px] font-semibold leading-snug text-yuni-slate-900">
                {q.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-yuni-slate-600">
                {q.description.slice(0, 50)}
                {q.description.length > 50 ? "…" : ""}
              </p>
              <p className="mt-2 text-xs text-yuni-slate-500">
                {q.steps.length} étapes
              </p>
            </YuniCard>
          ))}
        </div>
      )}

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <YuniCard className="max-w-md" header="Confirmer">
            <p className="text-sm text-yuni-slate-700">
              Lancer cette quête ? Tu pourras valider les étapes une par une.
            </p>
            <div className="mt-4 flex gap-2">
              <YuniButton
                onClick={() => {
                  void start.mutateAsync(confirmId);
                  setConfirmId(null);
                }}
              >
                Confirmer
              </YuniButton>
              <YuniButton variant="ghost" onClick={() => setConfirmId(null)}>
                Annuler
              </YuniButton>
            </div>
          </YuniCard>
        </div>
      ) : null}

      {inProgressEntries.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-editorial text-xl text-yuni-slate-900">
            Ta progression
          </h2>
          <p className="mt-2 text-sm text-yuni-slate-600">
            Valide chaque étape pour terminer la quête et récupérer l&apos;XP.
          </p>
          <QuestInProgressPanel
            entries={inProgressEntries}
            busyQuestId={progressMut.isPending ? progressMut.variables?.questId ?? null : null}
            onCompleteStep={(questId, stepOrder) =>
              progressMut.mutate({ questId, step: stepOrder })
            }
          />
        </section>
      ) : null}
    </div>
  );
}
