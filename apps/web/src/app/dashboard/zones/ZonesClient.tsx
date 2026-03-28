"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useDashboardVitality, useSentimentCity } from "@yuni/api-client/react";
import { YuniCard } from "@yuni/ui";

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
    selected ??
    zoneFromQuery ??
    zones[0]?.zone ??
    "centre";

  const zoneData = useMemo(
    () => zones.find((z) => z.zone === activeZone),
    [zones, activeZone],
  );

  const sentiment = useSentimentCity(city, true);
  const zoneSent = sentiment.data?.find((s) => s.zone === activeZone);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-editorial text-3xl text-yuni-slate-900">Zones</h1>
        <p className="text-sm text-yuni-slate-600">
          Analyse par quartier — {city}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-yuni-wheat-200 pb-3">
        {zones.map((z) => (
          <button
            key={z.zone}
            type="button"
            onClick={() => setSelected(z.zone)}
            className={`rounded-yuni-md px-3 py-1.5 text-sm font-medium ${
              activeZone === z.zone
                ? "bg-yuni-terracotta-500 text-white"
                : "bg-yuni-wheat-100 text-yuni-slate-800 hover:bg-yuni-wheat-200"
            }`}
          >
            {z.zone}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <YuniCard header="Score 5 dimensions (radar)">
          {zoneData ? (
            <ZoneRadarBlock dimensions={zoneData.dimensions} zone={activeZone} />
          ) : (
            <p className="text-sm text-yuni-slate-600">Chargement…</p>
          )}
        </YuniCard>
        <YuniCard header="Évolution 30 j. (illustration)">
          {zoneData ? (
            <ZoneLinesBlock
              baseScore={zoneData.score}
              dimensionKeys={Object.keys(zoneData.dimensions)}
            />
          ) : null}
        </YuniCard>
      </div>

      <YuniCard header="Sentiment — zone sélectionnée">
        {zoneSent ? (
          <div className="space-y-2 text-sm">
            <p>
              Humeur :{" "}
              <strong>{zoneSent.mood_score.toFixed(0)}</strong> —{" "}
              {zoneSent.sentiment}
            </p>
            <p>Sujets : {zoneSent.top_topics.join(", ") || "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-yuni-slate-600">Pas de données NLP.</p>
        )}
      </YuniCard>

      <YuniCard header="Acteurs actifs (aperçu)">
        <p className="text-sm text-yuni-slate-600">
          Détail complet sur la page{" "}
          <a className="text-yuni-terracotta-600 underline" href="/dashboard/actors">
            Acteurs
          </a>
          .
        </p>
      </YuniCard>
    </div>
  );
}
