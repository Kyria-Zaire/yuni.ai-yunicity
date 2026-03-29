"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useDashboardVitality, useSentimentCity } from "@yuni/api-client/react";

import { NeuroCard } from "@/components/neuro";
import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";

const ZoneRadarBlock = dynamic(() => import("./ZoneRadarBlock"), {
  ssr: false,
});
const ZoneLinesBlock = dynamic(() => import("./ZoneLinesBlock"), {
  ssr: false,
});

export default function ZonesClient() {
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const search = useSearchParams();
  const zoneFromQuery = search?.get("zone") ?? null;
  const vit = useDashboardVitality(city, true);
  const zones = useMemo(() => vit.data?.zones ?? [], [vit.data?.zones]);
  const [selected, setSelected] = useState<string | null>(null);

  const activeZone =
    selected ?? zoneFromQuery ?? zones[0]?.zone ?? "centre";

  const zoneData = useMemo(
    () => zones.find((z) => z.zone === activeZone),
    [zones, activeZone],
  );

  const sentiment = useSentimentCity(city, true);
  const zoneSent = sentiment.data?.find((s) => s.zone === activeZone);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold" style={{ color: "#2D3748" }}>
          Zones
        </h1>
        <p className="text-sm" style={{ color: "#4A5568" }}>
          Analyse par quartier — {city}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-400/40 pb-3">
        {zones.map((z) => (
          <button
            key={z.zone}
            type="button"
            onClick={() => setSelected(z.zone)}
            className={`rounded-yuni-md px-3 py-1.5 font-body text-sm font-medium ${
              activeZone === z.zone
                ? "bg-yuni-terracotta-500 text-white"
                : "bg-white/50 text-slate-800 shadow-[2px_2px_6px_#B8B4AF,-2px_-2px_6px_#FFFFFF] hover:bg-white/80"
            }`}
          >
            {z.zone}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <NeuroCard variant="raised">
          <h2 className="mb-4 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
            Score 5 dimensions (radar)
          </h2>
          {zoneData ? (
            <ZoneRadarBlock dimensions={zoneData.dimensions} zone={activeZone} />
          ) : (
            <p className="font-body text-sm" style={{ color: "#4A5568" }}>
              Chargement…
            </p>
          )}
        </NeuroCard>
        <NeuroCard variant="raised">
          <h2 className="mb-4 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
            Évolution 30 j. (illustration)
          </h2>
          {zoneData ? (
            <ZoneLinesBlock
              baseScore={zoneData.score}
              dimensionKeys={Object.keys(zoneData.dimensions)}
            />
          ) : null}
        </NeuroCard>
      </div>

      <NeuroCard variant="raised">
        <h2 className="mb-3 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          Sentiment — zone sélectionnée
        </h2>
        {zoneSent ? (
          <div className="space-y-2 font-body text-sm" style={{ color: "#2D3748" }}>
            <p>
              Humeur :{" "}
              <strong>{zoneSent.mood_score.toFixed(0)}</strong> —{" "}
              {zoneSent.sentiment}
            </p>
            <p>Sujets : {zoneSent.top_topics.join(", ") || "—"}</p>
          </div>
        ) : (
          <p className="font-body text-sm" style={{ color: "#4A5568" }}>
            Pas de données NLP.
          </p>
        )}
      </NeuroCard>

      <NeuroCard variant="flat">
        <h2 className="mb-2 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          Acteurs actifs (aperçu)
        </h2>
        <p className="font-body text-sm" style={{ color: "#4A5568" }}>
          Détail complet sur la page{" "}
          <a className="font-medium underline" style={{ color: "#8B2F08" }} href="/dashboard/actors">
            Acteurs
          </a>
          .
        </p>
      </NeuroCard>
    </div>
  );
}
