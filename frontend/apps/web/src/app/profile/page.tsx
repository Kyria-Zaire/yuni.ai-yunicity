"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import {
  useBadgesCatalog,
  useHealth,
  useLeaderboard,
  useXPProfile,
} from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import {
  VitalityGauge,
  XPBar,
  YuniAvatar,
  YuniButton,
  YuniCard,
} from "@yuni/ui";

import { DEFAULT_CITY } from "@/lib/constants";

const levelRank: Record<string, number> = {
  visiteur: 1,
  habitant: 2,
  citoyen: 3,
  acteur: 4,
  ambassadeur: 5,
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: health, isLoading: healthLoading } = useHealth();
  const xp = useXPProfile(Boolean(user));
  const badges = useBadgesCatalog();
  const [period, setPeriod] = useState<"week" | "month" | "all_time">("week");
  const board = useLeaderboard(DEFAULT_CITY, period, Boolean(user));

  const unlocked = new Set(xp.data?.badges ?? []);

  const nextLabel = xp.data?.level
    ? `${xp.data.level} → prochain palier`
    : "Progression";

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <YuniAvatar
            name={user?.email ?? "Citoyen"}
            level={levelRank[xp.data?.level ?? "visiteur"] ?? 1}
          />
          <div>
            <h1 className="font-editorial text-3xl text-yuni-slate-900">
              {user?.email ?? "Profil"}
            </h1>
            <p className="text-sm text-yuni-slate-500">
              {DEFAULT_CITY} · pseudonyme leaderboard anonymisé
            </p>
          </div>
        </div>
        <YuniButton variant="ghost" size="sm" onClick={logout}>
          Déconnexion
        </YuniButton>
      </div>

      <YuniCard header="API">
        {healthLoading ? (
          <p className="text-sm text-yuni-slate-600">Chargement /health…</p>
        ) : health ? (
          <p className="text-sm text-yuni-forest-700">
            {health.status} — v{health.version} ({health.environment})
          </p>
        ) : (
          <p className="text-sm text-yuni-terracotta-700">
            Backend injoignable.
          </p>
        )}
      </YuniCard>

      <section className="space-y-4">
        <h2 className="font-editorial text-xl text-yuni-slate-900">
          Expérience
        </h2>
        {xp.data ? (
          <>
            <XPBar
              currentXp={xp.data.total_xp}
              nextLevelXp={xp.data.next_level_xp}
              levelLabel={nextLabel}
            />
            <p className="text-xs text-yuni-slate-500">
              Total {xp.data.total_xp} XP · niveau {xp.data.level}
            </p>
          </>
        ) : (
          <p className="text-sm text-yuni-slate-600">Chargement profil XP…</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-editorial text-xl text-yuni-slate-900">
          Badges
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(badges.data ?? []).map((b) => {
            const on = unlocked.has(b.id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-yuni-lg border p-3 text-sm ${
                  on
                    ? "border-yuni-forest-300 bg-white text-yuni-forest-700 shadow-yuni-sm"
                    : "border-yuni-wheat-300 bg-yuni-wheat-50 text-yuni-slate-300 opacity-60"
                }`}
              >
                <p className="font-editorial text-base font-semibold text-yuni-slate-900">
                  {b.name}
                </p>
                <p className="mt-1 font-body text-xs text-yuni-slate-600">
                  {on ? "Débloqué" : b.condition}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-editorial text-xl text-yuni-slate-900">
          Historique XP
        </h2>
        <ul className="space-y-2">
          {(xp.data?.xp_history ?? []).slice(0, 10).map((row, i) => (
            <li
              key={`${i}-${JSON.stringify(row).slice(0, 40)}`}
              className="flex justify-between rounded-yuni-md border border-yuni-wheat-100 px-3 py-2 text-sm"
            >
              <span className="text-yuni-slate-700">Action</span>
              <span className="font-mono text-xs text-yuni-slate-500">
                {JSON.stringify(row).slice(0, 80)}
              </span>
            </li>
          ))}
          {(xp.data?.xp_history?.length ?? 0) === 0 ? (
            <li className="text-sm text-yuni-slate-500">
              Pas encore d’historique détaillé.
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-editorial text-xl text-yuni-slate-900">
            Leaderboard · {DEFAULT_CITY}
          </h2>
          <div className="flex gap-1 text-sm">
            {(["week", "month", "all_time"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`rounded-yuni-md px-2 py-1 ${
                  period === p
                    ? "bg-yuni-terracotta-100 text-yuni-terracotta-900"
                    : "text-yuni-slate-600 hover:bg-yuni-wheat-50"
                }`}
                onClick={() => setPeriod(p)}
              >
                {p === "week"
                  ? "Semaine"
                  : p === "month"
                    ? "Mois"
                    : "Tout temps"}
              </button>
            ))}
          </div>
        </div>
        {board.data ? (
          <YuniCard>
            <ol className="space-y-2">
              {board.data.entries.map((e) => (
                <li
                  key={e.rank}
                  className={`flex justify-between text-sm ${
                    e.is_current_user ? "font-semibold text-yuni-terracotta-800" : ""
                  }`}
                >
                  <span>
                    {e.rank}. {e.pseudonym}
                  </span>
                  <span>{e.total_xp} XP</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-yuni-slate-500">
              Ta place :{" "}
              {board.data.current_user_rank ?? "hors classement"} ·{" "}
              {board.data.total_participants} participant·es
            </p>
          </YuniCard>
        ) : (
          <p className="text-sm text-yuni-slate-600">Chargement…</p>
        )}
      </section>

      <div className="flex justify-center">
        <VitalityGauge score={68} grade="B" />
      </div>
    </main>
  );
}
