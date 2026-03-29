"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { useBudgetMonthly } from "@yuni/api-client/react";

import { NeuroCard, NeuroKPI } from "@/components/neuro";
import { useAdminToken } from "@/hooks/useAdminToken";

const BudgetBars = dynamic(() => import("./BudgetBars"), { ssr: false });

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

  const spentPct =
    data != null
      ? Math.min(
          100,
          data.spent_pct <= 1 ? data.spent_pct * 100 : data.spent_pct,
        )
      : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "#2D3748" }}>
            Budget Mistral
          </h1>
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Rapport mensuel —{" "}
            <code className="rounded bg-slate-200/80 px-1 text-xs text-slate-800">
              /v1/admin/budget/monthly
            </code>
          </p>
        </div>
        {data ? (
          <div className="text-right">
            <p className="font-body text-xs" style={{ color: "#4A5568" }}>
              Budget mensuel
            </p>
            <p
              className="font-mono text-2xl font-bold"
              style={{
                color: "#2D3748",
                fontFamily: "var(--font-neuro-mono), ui-monospace, monospace",
              }}
            >
              {data.spent_eur.toFixed(1)}€ / {data.budget_eur.toFixed(0)}€
            </p>
            <span
              className="mt-1 inline-block rounded-yuni-sm px-2 py-0.5 font-body text-xs font-semibold"
              style={{
                background:
                  data.status === "ok"
                    ? "rgba(45, 106, 79, 0.15)"
                    : data.status === "warning"
                      ? "rgba(217, 119, 6, 0.15)"
                      : "rgba(193, 68, 14, 0.15)",
                color:
                  data.status === "ok"
                    ? "#2D6A4F"
                    : data.status === "warning"
                      ? "#B45309"
                      : "#8B2F08",
              }}
            >
              {data.status.toUpperCase()}
            </span>
          </div>
        ) : null}
      </header>

      <NeuroCard variant="raised">
        <h2 className="mb-4 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          Coûts journaliers (Large vs Small)
        </h2>
        <BudgetBars data={chartData} />
      </NeuroCard>

      <section className="grid gap-4 md:grid-cols-3">
        <NeuroKPI label="Appels Large" value={largeCalls} status="warning" />
        <NeuroKPI label="Appels Small" value={smallCalls} status="ok" />
        <NeuroKPI
          label="Économie vs tout-Large"
          value={`+${savings.toFixed(1)}`}
          unit="€"
          status="ok"
        />
      </section>

      <NeuroCard variant="flat">
        <p className="font-body text-sm" style={{ color: "#2D3748" }}>
          Taux routing Small :{" "}
          <strong style={{ color: "#2D3748" }}>{routingPct}%</strong>
        </p>
        <p className="mt-2 font-body text-sm" style={{ color: "#4A5568" }}>
          À ce rythme, fin de mois estimée :{" "}
          <strong className="font-mono" style={{ color: "#2D3748" }}>
            {data?.projection_month_end_eur.toFixed(1) ?? "—"}€
          </strong>
        </p>
        {data ? (
          <div className="mt-4 h-3 w-full overflow-hidden rounded-yuni-full bg-slate-300/80">
            <div
              className="h-full bg-yuni-terracotta-500 transition-all"
              style={{ width: `${spentPct}%` }}
            />
          </div>
        ) : null}
      </NeuroCard>
    </div>
  );
}
