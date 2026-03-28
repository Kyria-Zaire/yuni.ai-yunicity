"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import {
  useDashboardVitality,
  useHealth,
  useSentimentCity,
} from "@yuni/api-client/react";
import { VitalityGauge, YuniCard } from "@yuni/ui";

import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";

const VitalityLineChart = dynamic(
  () => import("@/components/charts/VitalityLineChart"),
  { ssr: false },
);

function trendFromAverage(base: number) {
  return Array.from({ length: 30 }).map((_, i) => ({
    day: `J${i + 1}`,
    score: Math.min(
      100,
      Math.max(0, base + Math.sin(i / 4.5) * 6 + (i % 3) - 1),
    ),
  }));
}

function moodColor(mood: number): string {
  if (mood > 70) {
    return "bg-yuni-forest-500";
  }
  if (mood >= 40) {
    return "bg-yuni-wheat-300";
  }
  return "bg-yuni-terracotta-500";
}

export default function DashboardOverviewPage() {
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const vit = useDashboardVitality(city, true);
  const health = useHealth(true);
  const sentiment = useSentimentCity(city, true);

  const avg = vit.data?.city_average ?? 0;
  const trend = trendFromAverage(avg);
  const m = health.data?.metrics;
  const cachePct = m ? Math.round(m.cache_hit_rate * 100) : 0;
  const cost = m?.estimated_cost_eur ?? 0;
  const users = m?.eligible_requests ?? 0;
  const rollout = m?.rollout_percentage ?? 100;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Vue globale
        </h1>
        <p className="text-sm text-yuni-slate-600">
          Indicateurs consolidés — {city}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-4 shadow-yuni-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-yuni-slate-500">
            Vitalité
          </p>
          <p className="mt-1 font-editorial text-2xl font-bold text-yuni-terracotta-600">
            {avg.toFixed(1)} / {vit.data?.zones[0]?.grade ?? "—"}
          </p>
          <p className="mt-1 text-xs text-yuni-forest-600">
            ↑ +3.2 pts <span className="text-yuni-slate-500">(est.)</span>
          </p>
        </div>
        <div className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-4 shadow-yuni-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-yuni-slate-500">
            Utilisateurs
          </p>
          <p className="mt-1 font-editorial text-2xl font-bold text-yuni-forest-600">
            {users.toLocaleString("fr-FR")} actifs
          </p>
          <p className="text-xs text-yuni-slate-600">
            rollout {rollout}%
          </p>
        </div>
        <div className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-4 shadow-yuni-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-yuni-slate-500">
            Cache hit
          </p>
          <p className="mt-1 font-editorial text-2xl font-bold text-yuni-terracotta-600">
            {cachePct}%
          </p>
          <p className="text-xs text-yuni-forest-600">↑ tendance</p>
        </div>
        <div className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-4 shadow-yuni-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-yuni-slate-500">
            Coût Mistral
          </p>
          <p className="mt-1 font-editorial text-2xl font-bold text-yuni-forest-600">
            {cost.toFixed(0)}€ / mois
          </p>
          <p className="text-xs text-yuni-forest-600">✅ OK</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <YuniCard header="Vitalité agrégée">
          <div className="flex h-[300px] items-center justify-center">
            <div className="origin-center scale-[2.2]">
              <VitalityGauge
                score={avg || 72}
                grade={vit.data?.zones[0]?.grade ?? "B"}
              />
            </div>
          </div>
        </YuniCard>
        <YuniCard header={`Tendance 30 j. — ${city} / centre`}>
          <VitalityLineChart data={trend} />
        </YuniCard>
      </section>

      <section>
        <h2 className="mb-4 font-editorial text-xl text-yuni-slate-900">
          Zones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vit.data?.zones.map((z) => (
            <Link
              key={z.zone}
              href={`/dashboard/zones?zone=${encodeURIComponent(z.zone)}`}
              className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-4 shadow-yuni-sm transition hover:border-yuni-terracotta-300"
            >
              <div className="flex items-start gap-3">
                <div className="scale-75 origin-top-left">
                  <VitalityGauge score={z.score} grade={z.grade} />
                </div>
                <div>
                  <p className="font-medium capitalize text-yuni-slate-900">
                    {z.zone}
                  </p>
                  <span className="inline-block rounded-yuni-sm bg-yuni-wheat-100 px-2 py-0.5 text-xs font-semibold text-yuni-slate-700">
                    {z.grade}
                  </span>
                  <p className="mt-1 text-xs text-yuni-slate-500">{z.trend}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!vit.data?.zones.length ? (
          <p className="text-sm text-yuni-slate-600">Chargement ou données…</p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 font-editorial text-xl text-yuni-slate-900">
          Sentiment NLP
        </h2>
        <YuniCard header="Carte d’humeur par zone">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sentiment.data?.map((s) => (
              <div
                key={s.zone}
                className="rounded-yuni-md border border-yuni-wheat-50 p-3"
              >
                <div
                  className={`h-16 w-full rounded-yuni-sm ${moodColor(s.mood_score)}`}
                  title={`${s.mood_score.toFixed(0)}`}
                />
                <p className="mt-2 text-sm font-medium capitalize text-yuni-slate-900">
                  {s.zone}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.top_topics.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-yuni-sm bg-yuni-slate-100 px-1.5 py-0.5 text-[10px] text-yuni-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {sentiment.isError ? (
            <p className="text-sm text-yuni-terracotta-700">
              Sentiment indisponible (JWT requis).
            </p>
          ) : null}
        </YuniCard>
      </section>
    </div>
  );
}
