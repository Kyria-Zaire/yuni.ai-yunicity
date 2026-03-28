"use client";

import {
  useDashboardVitality,
  useFederationCompare,
  useFederationPeers,
  useFederationStats,
} from "@yuni/api-client/react";
import { YuniCard } from "@yuni/ui";

import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";
import { federationCityId } from "@/lib/federation-city";

function scoreColor(score: number): string {
  if (score > 70) {
    return "#1B4D3E";
  }
  if (score >= 40) {
    return "#D4A574";
  }
  return "#C1440E";
}

export default function DashboardFederationPage() {
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const vit = useDashboardVitality(city, true);
  const myScore = vit.data?.city_average ?? 72.5;
  const fid = federationCityId(city);

  const stats = useFederationStats(true);
  const peers = useFederationPeers(fid, true);
  const cmp = useFederationCompare(fid, myScore, true);

  const peerRows = peers.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Fédération EU
        </h1>
        <p className="text-sm text-yuni-slate-600">Comparaison inter-villes</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Mon score</p>
          <p className="font-editorial text-2xl font-bold text-yuni-terracotta-600">
            {myScore.toFixed(1)}
          </p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Moyenne fédération</p>
          <p className="font-editorial text-2xl font-bold text-yuni-slate-900">
            {stats.data?.avg_vitality_score?.toFixed(1) ?? "—"}
          </p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Percentile</p>
          <p className="text-sm font-medium text-yuni-forest-700">
            {cmp.data
              ? `Meilleure que ${cmp.data.percentile}% des villes`
              : "—"}
          </p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Delta</p>
          <p className="text-sm font-medium text-yuni-forest-700">
            {cmp.data
              ? `${cmp.data.delta >= 0 ? "+" : ""}${cmp.data.delta.toFixed(1)} vs moyenne`
              : "—"}
          </p>
        </div>
      </section>

      <YuniCard header="Carte EU (schéma)">
        <svg
          viewBox="0 0 400 240"
          className="h-auto w-full max-w-2xl text-yuni-slate-300"
          role="img"
          aria-label="Schéma stylisé de l’Union européenne"
        >
          <rect
            x="40"
            y="40"
            width="320"
            height="160"
            rx="12"
            fill="#f5efe6"
            stroke="#cbd5e1"
          />
          {peerRows.slice(0, 8).map((p, i) => {
            const x = 80 + (i % 4) * 70;
            const y = 80 + Math.floor(i / 4) * 60;
            const c = scoreColor(p.vitality_score_avg);
            return (
              <g key={p.city_id}>
                <title>
                  {p.display_name} — {p.vitality_score_avg.toFixed(1)}
                </title>
                <circle cx={x} cy={y} r="10" fill={c} opacity={0.9} />
                <text
                  x={x}
                  y={y + 24}
                  textAnchor="middle"
                  className="fill-yuni-slate-600"
                  style={{ fontSize: 9 }}
                >
                  {p.country}
                </text>
              </g>
            );
          })}
        </svg>
      </YuniCard>

      <YuniCard header="Villes pairs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-yuni-wheat-200">
                <th className="py-2">Ville</th>
                <th>Pays</th>
                <th>Population</th>
                <th>Score</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {peerRows.map((p) => (
                <tr key={p.city_id} className="border-b border-yuni-wheat-50">
                  <td className="py-2 font-medium">{p.display_name}</td>
                  <td>{p.country}</td>
                  <td>{p.population_range}</td>
                  <td>{p.vitality_score_avg.toFixed(1)}</td>
                  <td className="text-yuni-slate-600">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </YuniCard>
    </div>
  );
}
