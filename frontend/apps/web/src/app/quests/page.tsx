"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useYuniAIClient } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { YuniButton, YuniCard } from "@yuni/ui";

import { apiLoadErrorMessage } from "@/lib/api-query-errors";
import { DEFAULT_CITY } from "@/lib/constants";

import type { Quest, QuestDifficulty } from "@yuni/api-client";

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

export default function QuestsPage() {
  const client = useYuniAIClient();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const quests = useQuery({
    queryKey: ["quests", DEFAULT_CITY],
    queryFn: () => client.getQuests(DEFAULT_CITY),
    enabled: isAuthenticated,
  });

  const start = useMutation({
    mutationFn: (questId: string) =>
      client.startQuest(DEFAULT_CITY, questId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["quests", DEFAULT_CITY] });
    },
  });

  const progress = useMutation({
    mutationFn: ({
      questId,
      step,
    }: {
      questId: string;
      step: number;
    }) => client.completeQuestStep(DEFAULT_CITY, questId, step),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ["quests", DEFAULT_CITY] });
      const mod = await import("canvas-confetti");
      mod.default({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    },
  });

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

      {!isAuthenticated ? (
        <p className="text-yuni-slate-600">Connecte-toi pour voir les quêtes.</p>
      ) : quests.isError ? (
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
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {(quests.data ?? []).map((q: Quest) => (
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

      <section className="mt-12">
        <h2 className="font-editorial text-xl text-yuni-slate-900">
          Progression (démo)
        </h2>
        <p className="mt-2 text-sm text-yuni-slate-600">
          Valide l’étape 1 d’une quête démarrée — appelle l’API{" "}
          <code className="font-mono">/v1/quests/.../step/1</code>.
        </p>
        <QuestProgressDemo
          quests={quests.data ?? []}
          onStep={(questId) => progress.mutate({ questId, step: 1 })}
          busy={progress.isPending}
        />
      </section>
    </div>
  );
}

function QuestProgressDemo({
  quests,
  onStep,
  busy,
}: {
  quests: Quest[];
  onStep: (id: string) => void;
  busy: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const q = quests.find((x) => x.id === sel);
  if (!quests.length) {
    return null;
  }
  return (
    <div className="mt-4 space-y-4">
      <select
        className="rounded-yuni-md border border-yuni-wheat-100 px-2 py-2 text-sm"
        value={sel ?? ""}
        onChange={(e) => setSel(e.target.value || null)}
      >
        <option value="">Choisir une quête</option>
        {quests.map((x) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
      </select>
      {q ? (
        <div className="space-y-2">
          {q.steps.map((s, idx) => (
            <div
              key={s.order}
              className="flex items-center gap-2 text-sm text-yuni-slate-700"
            >
              <span
                className={`h-6 w-6 rounded-full text-center text-xs leading-6 ${
                  idx === 0 ? "bg-yuni-terracotta-500 text-white" : "bg-yuni-wheat-100"
                }`}
              >
                {idx + 1}
              </span>
              <span className="line-clamp-1">{s.description}</span>
            </div>
          ))}
          <YuniButton
            size="sm"
            loading={busy}
            onClick={() => onStep(q.id)}
          >
            Valider l’étape 1
          </YuniButton>
        </div>
      ) : null}
    </div>
  );
}
