"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import {
  useDashboardVitality,
  useHealth,
  useSentimentCity,
} from "@yuni/api-client/react";
import { VitalityGauge } from "@yuni/ui";

import { NeuroCard, NeuroKPI } from "@/components/neuro";
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
        <h1 className="font-display text-3xl font-bold" style={{ color: "#2D3748" }}>
          Vue globale
        </h1>
        <p className="text-sm" style={{ color: "#4A5568" }}>
          Indicateurs consolidés — {city}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NeuroKPI
          label="Vitalité"
          value={avg.toFixed(1)}
          unit={`/ ${vit.data?.zones[0]?.grade ?? "—"}`}
          status="ok"
          trend="up"
        />
        <NeuroKPI
          label="Utilisateurs"
          value={users.toLocaleString("fr-FR")}
          unit="actifs"
          status="neutral"
        />
        <NeuroKPI
          label="Cache hit"
          value={cachePct}
          unit="%"
          status="ok"
          trend="up"
        />
        <NeuroKPI
          label="Coût Mistral"
          value={cost.toFixed(0)}
          unit="€/mois"
          status="ok"
        />
      </section>

      <p className="font-body text-xs" style={{ color: "#4A5568" }}>
        Rollout {rollout}%
      </p>

      <section className="grid gap-8 lg:grid-cols-2">
        <NeuroCard variant="raised">
          <h2 className="mb-4 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
            Vitalité agrégée
          </h2>
          <div className="flex h-[300px] items-center justify-center">
            <div className="origin-center scale-[2.2]">
              <VitalityGauge
                score={avg || 72}
                grade={vit.data?.zones[0]?.grade ?? "B"}
              />
            </div>
          </div>
        </NeuroCard>
        <NeuroCard variant="raised">
          <h2 className="mb-4 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
            Tendance 30 j. — {city} / centre
          </h2>
          <VitalityLineChart data={trend} />
        </NeuroCard>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl" style={{ color: "#2D3748" }}>
          Zones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vit.data?.zones.map((z) => (
            <Link
              key={z.zone}
              href={`/dashboard/zones?zone=${encodeURIComponent(z.zone)}`}
              className="block transition hover:opacity-95"
            >
              <NeuroCard variant="raised" className="h-full hover:shadow-[8px_8px_16px_#B8B4AF,-4px_-4px_12px_#FFFFFF]">
                <div className="flex items-start gap-3">
                  <div className="origin-top-left scale-75">
                    <VitalityGauge score={z.score} grade={z.grade} />
                  </div>
                  <div>
                    <p className="font-body font-medium capitalize" style={{ color: "#2D3748" }}>
                      {z.zone}
                    </p>
                    <span
                      className="mt-1 inline-block rounded-yuni-sm px-2 py-0.5 font-body text-xs font-semibold"
                      style={{ background: "#f0ebe4", color: "#2D3748" }}
                    >
                      {z.grade}
                    </span>
                    <p className="mt-1 font-body text-xs" style={{ color: "#4A5568" }}>
                      {z.trend}
                    </p>
                  </div>
                </div>
              </NeuroCard>
            </Link>
          ))}
        </div>
        {!vit.data?.zones.length ? (
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Chargement ou données…
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl" style={{ color: "#2D3748" }}>
          Sentiment NLP
        </h2>
        <NeuroCard variant="raised">
          <h3 className="mb-3 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
            Carte d&apos;humeur par zone
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sentiment.data?.map((s) => (
              <div
                key={s.zone}
                className="rounded-yuni-md border border-slate-300/60 bg-white/35 p-3"
              >
                <div
                  className={`h-16 w-full rounded-yuni-sm ${moodColor(s.mood_score)}`}
                  title={`${s.mood_score.toFixed(0)}`}
                />
                <p className="mt-2 font-body text-sm font-medium capitalize" style={{ color: "#2D3748" }}>
                  {s.zone}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.top_topics.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-yuni-sm bg-white/60 px-1.5 py-0.5 font-body text-[10px]"
                      style={{ color: "#2D3748" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {sentiment.isError ? (
            <p className="mt-2 font-body text-sm" style={{ color: "#8B2F08" }}>
              Sentiment indisponible (JWT requis).
            </p>
          ) : null}
        </NeuroCard>
      </section>
    </div>
  );
}
