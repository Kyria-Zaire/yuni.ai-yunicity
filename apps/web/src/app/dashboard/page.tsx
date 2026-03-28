"use client";

import dynamic from "next/dynamic";

import {
  useDashboardActors,
  useDashboardEngagement,
  useDashboardVitality,
} from "@yuni/api-client/react";
import { VitalityGauge, YuniCard } from "@yuni/ui";

import { DEFAULT_CITY } from "@/lib/constants";

const VitalityLineChart = dynamic(
  () => import("@/components/charts/VitalityLineChart"),
  { ssr: false },
);

const trend = Array.from({ length: 12 }).map((_, i) => ({
  day: `J${i + 1}`,
  score: 60 + Math.round(Math.sin(i / 2) * 15),
}));

export default function CityDashboardPage() {
  const vit = useDashboardVitality(DEFAULT_CITY, true);
  const eng = useDashboardEngagement(DEFAULT_CITY, true);
  const act = useDashboardActors(DEFAULT_CITY, true);

  const forbidden = vit.isError || eng.isError || act.isError;
  const err = forbidden
    ? "Accès réservé : JWT avec rôle city_dashboard et ville correspondante."
    : null;

  return (
    <div className="min-h-screen bg-yuni-wheat-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header>
          <h1 className="font-editorial text-3xl text-yuni-slate-900">
            Dashboard ville · {DEFAULT_CITY}
          </h1>
          <p className="text-sm text-yuni-slate-600">
            Vue globale — métriques alignées sur l’API `/v1/dashboard/*`
          </p>
        </header>

        {err ? (
          <YuniCard variant="bordered">
            <p className="text-sm text-yuni-terracotta-800">{err}</p>
          </YuniCard>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <YuniCard header="Vitalité par zone">
            {vit.data ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {vit.data.zones.slice(0, 4).map((z) => (
                  <div key={z.zone} className="flex items-center gap-3">
                    <VitalityGauge score={z.score} grade={z.grade} />
                    <div>
                      <p className="font-medium capitalize">{z.zone}</p>
                      <p className="text-xs text-yuni-slate-500">{z.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-yuni-slate-600">Chargement…</p>
            )}
          </YuniCard>
          <YuniCard header="Engagement (30j)">
            {eng.data ? (
              <ul className="space-y-2 text-sm">
                <li>
                  Recommandations servies :{" "}
                  {eng.data.metrics.recommendations_served}
                </li>
                <li>
                  Cache hit :{" "}
                  {(eng.data.metrics.cache_hit_rate * 100).toFixed(1)}%
                </li>
                <li>Rollout : {eng.data.metrics.rollout_percentage}%</li>
                <li>
                  Coût estimé : {eng.data.metrics.estimated_cost_eur.toFixed(2)}{" "}
                  €
                </li>
              </ul>
            ) : (
              <p className="text-sm text-yuni-slate-600">Chargement…</p>
            )}
          </YuniCard>
        </section>

        <YuniCard header="Tendance vitalité (illustration)">
          <VitalityLineChart data={trend} />
        </YuniCard>

        <YuniCard header="Acteurs">
          {act.data ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-yuni-wheat-100">
                    <th className="py-2">Nom</th>
                    <th>Catégorie</th>
                    <th>Reco</th>
                  </tr>
                </thead>
                <tbody>
                  {act.data.actors.map((a) => (
                    <tr key={a.id} className="border-b border-yuni-wheat-50">
                      <td className="py-2">{a.name}</td>
                      <td>{a.category}</td>
                      <td>{a.recommendation_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-yuni-slate-600">Chargement…</p>
          )}
        </YuniCard>

        <YuniCard header="Export ODbL">
          <p className="text-sm text-yuni-slate-600">
            Utilise l’endpoint{" "}
            <code className="font-mono">GET /v1/dashboard/{DEFAULT_CITY}/export</code>{" "}
            avec ton JWT ville — JSON ou CSV.
          </p>
        </YuniCard>
      </div>
    </div>
  );
}
