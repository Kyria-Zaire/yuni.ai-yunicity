"use client";

import Link from "next/link";

import { useQuests } from "@yuni/api-client/react";

import { DEFAULT_CITY } from "@/lib/constants";

export function ActiveQuestsWidget() {
  const quests = useQuests(DEFAULT_CITY, undefined, true);
  const list = (quests.data ?? []).slice(0, 4);

  return (
    <div className="border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
      <h3 className="font-display text-base font-bold text-yuni-slate-900">
        Quêtes actives
      </h3>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-yuni-slate-500">Aucune quête listée.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {list.map((q) => (
            <li key={q.id} className="border-b border-yuni-wheat-100 pb-2">
              <span className="font-medium text-yuni-slate-800">{q.title}</span>
              <span className="ml-2 text-yuni-terracotta-600">＋{q.xp_reward} XP</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/quests"
        className="mt-3 inline-block text-sm font-medium text-yuni-terracotta-600 underline"
      >
        Toutes les quêtes
      </Link>
    </div>
  );
}
