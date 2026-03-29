"use client";

import Link from "next/link";

import type { Quest } from "@yuni/api-client";

export function DailyQuestCard({ quest }: { quest: Quest | null }) {
  if (!quest) {
    return (
      <div className="rounded-yuni-lg border border-yuni-wheat-200 bg-yuni-wheat-50 p-6 text-yuni-slate-600">
        <p className="font-body text-sm">Aucune quête mise en avant aujourd’hui.</p>
        <Link href="/quests" className="mt-2 inline-block text-sm font-medium text-yuni-terracotta-600 underline">
          Voir les quêtes
        </Link>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-yuni-lg bg-yuni-slate-900 text-white shadow-yuni-lg">
      <div className="p-6 md:p-8">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-yuni-slate-400">
          Quête du jour · {quest.difficulty}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
          {quest.title}
        </h2>
        <p className="mt-3 line-clamp-3 font-body text-sm text-yuni-slate-300">
          {quest.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-yuni-terracotta-500 px-3 py-1 text-xs font-bold">
            ＋{quest.xp_reward} XP
          </span>
          <span className="text-sm text-yuni-slate-400">{quest.estimated_duration}</span>
        </div>
        <Link
          href="/quests"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-yuni-md bg-white px-6 py-3 font-body text-sm font-semibold text-yuni-slate-900 transition-colors hover:bg-yuni-terracotta-100"
        >
          Commencer l’aventure
        </Link>
      </div>
    </article>
  );
}
