"use client";

import { useSentimentCity } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

export function SentimentWidget({ citySlug }: { citySlug: string }) {
  const { token } = useAuth();
  const q = useSentimentCity(citySlug, Boolean(token));
  const rows = q.data ?? [];

  return (
    <div className="border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
      <h3 className="font-display text-base font-bold text-yuni-slate-900">
        Sentiment · territoire
      </h3>
      {q.isPending ? (
        <p className="mt-2 text-sm text-yuni-slate-500">Chargement…</p>
      ) : !token ? (
        <p className="mt-2 text-sm text-yuni-slate-600">
          Connecte-toi pour voir le sentiment par zone.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-yuni-slate-600">
          Aucune donnée pour le moment.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 4).map((z) => (
            <li
              key={`${z.city}-${z.zone}`}
              className="flex justify-between gap-2 border-b border-yuni-wheat-100 pb-2"
            >
              <span className="text-yuni-slate-700">{z.zone}</span>
              <span className="font-medium capitalize text-yuni-slate-900">
                {z.sentiment} · {z.mood_score.toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
