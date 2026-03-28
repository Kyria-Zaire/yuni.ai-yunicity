"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  useDashboardEngagement,
  useHealth,
  useLeaderboard,
  useXPProfile,
} from "@yuni/api-client/react";
import { YuniCard } from "@yuni/ui";

import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";

const HourlyBar = dynamic(() => import("./HourlyBar"), { ssr: false });
const InterestDonut = dynamic(() => import("./InterestDonut"), { ssr: false });

export default function DashboardEngagementPage() {
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const eng = useDashboardEngagement(city, true);
  const health = useHealth(true);
  const lb = useLeaderboard(city, "week", true);
  const xp = useXPProfile(true);

  const m = eng.data?.metrics;
  const recs = m?.recommendations_served ?? 0;
  const rollout = m?.rollout_percentage ?? 0;

  const hourlyData = useMemo(() => {
    const total = Math.max(recs, 48);
    return Array.from({ length: 24 }).map((_, h) => ({
      hour: `${h}h`,
      requetes: Math.round(
        (total / 24) * (0.55 + Math.sin((h - 6) / 4) * 0.35 + (h % 5) * 0.02),
      ),
    }));
  }, [recs]);

  const interests = useMemo(
    () => [
      { name: "Sport", value: 32, fill: "#1B4D3E" },
      { name: "Culture", value: 24, fill: "#64748B" },
      { name: "Gastronomie", value: 18, fill: "#C1440E" },
      { name: "Nature", value: 14, fill: "#D4A574" },
      { name: "Autre", value: 12, fill: "#94a3b8" },
    ],
    [],
  );

  const xpTotal = health.data?.metrics.xp_awarded ?? xp.data?.total_xp ?? 0;
  const badges = health.data?.metrics.badges_unlocked ?? 0;
  const questsDone = health.data?.metrics.quests_completed ?? 0;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Engagement
        </h1>
        <p className="text-sm text-yuni-slate-600">Métriques — {city}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Utilisateurs actifs</p>
          <p className="font-editorial text-2xl font-bold text-yuni-forest-600">
            {(health.data?.metrics.eligible_requests ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-yuni-slate-600">Δ vs sem. préc. +2.1%</p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Rollout</p>
          <p className="font-editorial text-2xl font-bold text-yuni-terracotta-600">
            {rollout}%
          </p>
          <p className="text-xs text-yuni-slate-600">Lecture seule (ville)</p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Recommandations servies</p>
          <p className="font-editorial text-2xl font-bold text-yuni-slate-900">
            {recs.toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="rounded-yuni-lg bg-white p-4 shadow-yuni-sm">
          <p className="text-xs text-yuni-slate-500">Quêtes complétées</p>
          <p className="font-editorial text-2xl font-bold text-yuni-forest-600">
            {questsDone}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <YuniCard header="Distribution horaire (modèle)">
          <HourlyBar data={hourlyData} />
        </YuniCard>
        <YuniCard header="Top intérêts (illustration)">
          <InterestDonut data={interests} />
        </YuniCard>
      </div>

      <YuniCard header="Gamification">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-yuni-slate-500">XP total distribué</p>
            <p className="text-xl font-bold text-yuni-terracotta-600">
              {xpTotal.toLocaleString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-yuni-slate-500">Badges débloqués</p>
            <p className="text-xl font-bold text-yuni-slate-900">{badges}</p>
          </div>
          <div>
            <p className="text-xs text-yuni-slate-500">Leaderboard (top 5)</p>
            <ul className="mt-2 space-y-1 text-sm">
              {lb.data?.entries.slice(0, 5).map((e) => (
                <li key={e.rank} className="flex justify-between gap-2">
                  <span className="text-yuni-slate-600">{e.pseudonym}</span>
                  <span className="font-medium">{e.total_xp} XP</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </YuniCard>
    </div>
  );
}
