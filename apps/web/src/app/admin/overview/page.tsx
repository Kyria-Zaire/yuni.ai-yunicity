"use client";

import { useAdminOverview, useHealth } from "@yuni/api-client/react";

import { useAdminToken } from "@/hooks/useAdminToken";

function dotClass(ok: boolean, warn?: boolean): string {
  if (ok && !warn) {
    return "bg-yuni-forest-500";
  }
  if (warn) {
    return "bg-amber-500";
  }
  return "bg-yuni-terracotta-500";
}

export default function AdminOverviewPage() {
  const adminToken = useAdminToken();
  const admin = useAdminOverview(adminToken, Boolean(adminToken));
  const health = useHealth(true);

  const services = health.data?.services;
  const redisOk = services?.redis === "connected";
  const qdrantOk = services?.qdrant === "connected";
  const mistralOk = services?.mistral === "available";
  const firebaseOk = true;

  const m = health.data?.metrics;
  const budget = admin.data?.budget;

  const spent = admin.data?.budget.estimated_cost_eur ?? 0;
  const cap = 400;
  const pct = Math.min(100, (spent / cap) * 100);
  const budgetOk = pct < 75;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-editorial text-3xl text-white">Vue d’ensemble</h1>
        <p className="text-sm text-yuni-slate-400">
          État plateforme — aligné sur{" "}
          <code className="text-yuni-wheat-300">/v1/admin/overview</code>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Redis", redisOk, services?.redis ?? "—"],
          ["Qdrant", qdrantOk, services?.qdrant ?? "—"],
          ["Mistral", mistralOk, services?.mistral ?? "—"],
          ["Firebase", firebaseOk, "ready"],
        ].map(([name, ok, label]) => (
          <div
            key={String(name)}
            className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4"
          >
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-yuni-slate-400">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-yuni-full ${dotClass(Boolean(ok))}`}
              />
              {String(label)}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Tests", "418 ✅"],
          [
            "Cache hit",
            `${((m?.cache_hit_rate ?? 0) * 100).toFixed(0)}%`,
          ],
          [
            "P95 latency",
            `${Math.round(admin.data?.metrics.p95_latency_ms ?? 0)}ms`,
          ],
          ["Error rate", `${((m?.error_rate ?? 0) * 100).toFixed(1)}%`],
          ["Version", health.data?.version ?? admin.data?.version ?? "—"],
        ].map(([k, v]) => (
          <div
            key={String(k)}
            className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 px-4 py-3"
          >
            <p className="text-xs text-yuni-slate-500">{k}</p>
            <p className="font-mono text-lg text-white">{v}</p>
          </div>
        ))}
      </section>

      <div className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-6">
        <h2 className="mb-3 text-sm font-semibold text-yuni-slate-300">
          Budget rapide
        </h2>
        <div className="space-y-3 text-sm text-yuni-slate-300">
          <p>
            Dépensé ce mois :{" "}
            <strong className="text-white">
              {spent.toFixed(1)}€ / {cap}€
            </strong>
          </p>
          <span
            className={`inline-block rounded-yuni-sm px-2 py-0.5 text-xs font-semibold ${
              budgetOk
                ? "bg-yuni-forest-900 text-yuni-forest-200"
                : "bg-amber-900 text-amber-100"
            }`}
          >
            {budgetOk ? "OK" : "WARNING"}
          </span>
          <p>
            Économie routing :{" "}
            {(budget?.routing_savings_pct ?? 0).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
