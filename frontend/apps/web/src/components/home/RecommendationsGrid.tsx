"use client";

import { YuniCard } from "@yuni/ui";

export interface RecoCard {
  kind: "actor" | "event";
  title: string;
  sub: string;
  score: number;
}

export function RecommendationsGrid({ cards }: { cards: RecoCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-yuni-slate-500">
        Aucune recommandation pour l’instant.
      </p>
    );
  }

  return (
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
  );
}
