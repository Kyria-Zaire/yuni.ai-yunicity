"use client";

import { useEffect, useState } from "react";

import {
  useAdminOverview,
  useFlushCityCacheMutation,
  useHealth,
  useVerifyAuditMutation,
} from "@yuni/api-client/react";

import {
  NeuroButton,
  NeuroCard,
  NeuroKPI,
  NeuroStatus,
  mapHealthServiceToNeuro,
} from "@/components/neuro";
import { useAdminToken } from "@/hooks/useAdminToken";
import { DEFAULT_CITY } from "@/lib/constants";

const BUDGET_CAP_EUR = 400;

function budgetKpiStatus(spent: number): "ok" | "warning" | "critical" | "neutral" {
  const pct = (spent / BUDGET_CAP_EUR) * 100;
  if (pct < 75) {
    return "ok";
  }
  if (pct < 90) {
    return "warning";
  }
  return "critical";
}

export default function AdminOverviewPage() {
  const adminToken = useAdminToken();
  const admin = useAdminOverview(adminToken, Boolean(adminToken));
  const health = useHealth(true);
  const flushMut = useFlushCityCacheMutation();
  const verifyMut = useVerifyAuditMutation();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const services = health.data?.services;
  const m = health.data?.metrics;
  const budget = admin.data?.budget;
  const spent = budget?.estimated_cost_eur ?? 0;

  const vitalityScore =
    m != null
      ? Math.max(
          0,
          Math.min(100, Math.round((1 - Math.min(1, m.error_rate)) * 100)),
        )
      : null;

  const handleFlushCache = () => {
    if (!adminToken) {
      setToast("Token admin manquant");
      return;
    }
    flushMut.mutate(
      { adminToken, city: DEFAULT_CITY },
      {
        onSuccess: () => setToast(`Cache ${DEFAULT_CITY} invalidé.`),
        onError: () => setToast("Échec du vidage cache"),
      },
    );
  };

  const handleVerifyAudit = () => {
    if (!adminToken) {
      setToast("Token admin manquant");
      return;
    }
    verifyMut.mutate(
      { adminToken, city: DEFAULT_CITY },
      {
        onSuccess: (r) => {
          setToast(
            r.chain_valid
              ? "Intégrité vérifiée"
              : "Anomalie détectée sur la chaîne",
          );
        },
        onError: () => setToast("Échec de la vérification"),
      },
    );
  };

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className="rounded-yuni-md border border-slate-300 bg-white/90 px-4 py-2 text-sm shadow-yuni-sm"
          style={{ color: "#2D3748" }}
        >
          {toast}
        </div>
      ) : null}

      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#2D3748" }}>
          Vue d&apos;ensemble
        </h1>
        <p className="mt-1 font-body text-sm" style={{ color: "#4A5568" }}>
          État plateforme en temps réel — aligné sur{" "}
          <code className="rounded bg-slate-200/80 px-1 text-xs text-slate-800">
            /v1/admin/overview
          </code>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NeuroKPI
          label="Santé API"
          value={vitalityScore ?? "—"}
          unit="/ 100"
          status="ok"
          trend="stable"
        />
        <NeuroKPI
          label="Cache hit"
          value={
            m != null ? `${Math.round(m.cache_hit_rate * 100)}` : "—"
          }
          unit="%"
          status="ok"
        />
        <NeuroKPI
          label="Budget Mistral"
          value={budget != null ? spent.toFixed(1) : "—"}
          unit="€"
          status={budget != null ? budgetKpiStatus(spent) : "neutral"}
        />
        <NeuroKPI label="Tests" value="418" status="ok" trend="stable" />
      </div>

      <div>
        <h2
          className="mb-3 font-body text-xs uppercase tracking-widest"
          style={{ color: "#4A5568" }}
        >
          Services
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NeuroStatus
            label="Redis"
            status={mapHealthServiceToNeuro(services?.redis)}
          />
          <NeuroStatus
            label="Qdrant"
            status={mapHealthServiceToNeuro(services?.qdrant)}
          />
          <NeuroStatus
            label="Mistral"
            status={mapHealthServiceToNeuro(services?.mistral, "available")}
          />
          <NeuroStatus label="Firebase" status="ready" />
        </div>
      </div>

      <NeuroCard variant="raised">
        <h2 className="mb-3 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          Métriques rapides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["P95 latency", `${Math.round(admin.data?.metrics.p95_latency_ms ?? 0)}ms`],
            [
              "Taux d'erreur",
              `${((m?.error_rate ?? 0) * 100).toFixed(1)}%`,
            ],
            ["Version", health.data?.version ?? admin.data?.version ?? "—"],
            [
              "Économie routing",
              `${(budget?.routing_savings_pct ?? 0).toFixed(1)}%`,
            ],
            [
              "Utilisateurs éligibles",
              String(admin.data?.users.total_eligible ?? "—"),
            ],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-yuni-md bg-white/40 px-3 py-2">
              <p className="font-body text-xs" style={{ color: "#4A5568" }}>
                {k}
              </p>
              <p
                className="font-mono text-lg font-semibold"
                style={{
                  color: "#2D3748",
                  fontFamily: "var(--font-neuro-mono), ui-monospace, monospace",
                }}
              >
                {v}
              </p>
            </div>
          ))}
        </div>
      </NeuroCard>

      <NeuroCard variant="raised">
        <h2 className="mb-3 font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <NeuroButton
            onClick={handleFlushCache}
            disabled={flushMut.isPending}
            loading={flushMut.isPending}
          >
            Vider le cache
          </NeuroButton>
          <NeuroButton
            onClick={handleVerifyAudit}
            variant="ghost"
            disabled={verifyMut.isPending}
            loading={verifyMut.isPending}
          >
            Vérifier l&apos;intégrité
          </NeuroButton>
        </div>
      </NeuroCard>
    </div>
  );
}
