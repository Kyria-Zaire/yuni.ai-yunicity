"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { useBudgetMonthly } from "@yuni/api-client/react";

import { useAdminToken } from "@/hooks/useAdminToken";

const BudgetBars = dynamic(() => import("./BudgetBars"), { ssr: false });

function statusBadge(status: string): string {
  if (status === "ok") {
    return "bg-yuni-forest-900 text-yuni-forest-200";
  }
  if (status === "warning") {
    return "bg-amber-900 text-amber-100";
  }
  return "bg-yuni-terracotta-900 text-yuni-terracotta-100";
}

export default function AdminBudgetPage() {
  const adminToken = useAdminToken();
  const { data } = useBudgetMonthly(adminToken, Boolean(adminToken));

  const chartData = useMemo(
    () =>
      (data?.daily_breakdown ?? []).map((d) => ({
        date: d.date.slice(5),
        large: d.mistral_large_cost_eur,
        small: d.mistral_small_cost_eur,
      })),
    [data?.daily_breakdown],
  );

  const largeCalls = data?.daily_breakdown?.[0]?.calls_large ?? 0;
  const smallCalls = data?.daily_breakdown?.[0]?.calls_small ?? 0;
  const routingPct =
    largeCalls + smallCalls > 0
      ? Math.round((smallCalls / (largeCalls + smallCalls)) * 100)
      : 0;

  const savings =
    data?.daily_breakdown?.reduce(
      (acc, d) => acc + (d.savings_vs_all_large_eur ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-white">Budget Mistral</h1>
          <p className="text-sm text-yuni-slate-400">
            Rapport mensuel —{" "}
            <code className="text-yuni-wheat-300">/v1/admin/budget/monthly</code>
          </p>
        </div>
        {data ? (
          <div className="text-right">
            <p className="text-xs text-yuni-slate-500">Budget mensuel</p>
            <p className="font-editorial text-2xl text-white">
              {data.spent_eur.toFixed(1)}€ / {data.budget_eur.toFixed(0)}€
            </p>
            <span
              className={`mt-1 inline-block rounded-yuni-sm px-2 py-0.5 text-xs font-semibold ${statusBadge(data.status)}`}
            >
              {data.status.toUpperCase()}
            </span>
          </div>
        ) : null}
      </header>

      <section className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4">
        <h2 className="mb-4 text-sm font-medium text-yuni-slate-300">
          Coûts journaliers (Large vs Small)
        </h2>
        <BudgetBars data={chartData} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4">
          <p className="text-xs text-yuni-slate-500">Appels Large</p>
          <p className="text-xl font-bold text-yuni-terracotta-400">{largeCalls}</p>
        </div>
        <div className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4">
          <p className="text-xs text-yuni-slate-500">Appels Small</p>
          <p className="text-xl font-bold text-yuni-slate-200">{smallCalls}</p>
        </div>
        <div className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4">
          <p className="text-xs text-yuni-slate-500">Économie vs tout-Large</p>
          <p className="text-xl font-bold text-yuni-forest-400">
            +{savings.toFixed(1)}€
          </p>
        </div>
      </section>

      <div className="rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-4 text-sm text-yuni-slate-300">
        <p>
          Taux routing Small : <strong className="text-white">{routingPct}%</strong>
        </p>
        <p className="mt-2">
          À ce rythme, fin de mois estimée :{" "}
          <strong className="text-white">
            {data?.projection_month_end_eur.toFixed(1) ?? "—"}€
          </strong>
        </p>
        {data ? (
          <div className="mt-4 h-3 w-full overflow-hidden rounded-yuni-full bg-yuni-slate-800">
            <div
              className="h-full bg-yuni-terracotta-500 transition-all"
              style={{
                width: `${Math.min(100, (data.spent_pct <= 1 ? data.spent_pct * 100 : data.spent_pct))}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
