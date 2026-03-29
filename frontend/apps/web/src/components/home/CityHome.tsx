"use client";

import Link from "next/link";

import {
  useAuditChain,
  useDashboardVitality,
  useHealth,
} from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

import {
  mapHealthServiceToNeuro,
  NeuroCard,
  NeuroKPI,
  NeuroStatus,
} from "@/components/neuro";
import { DEFAULT_CITY } from "@/lib/constants";

export function CityHome() {
  const { isAuthenticated } = useAuth();
  const { data: health } = useHealth();
  const { data: vitality } = useDashboardVitality(DEFAULT_CITY, true);
  const { data: audit } = useAuditChain(DEFAULT_CITY, {
    enabled: isAuthenticated,
  });

  const vitScore = vitality?.city_average;

  return (
    <main className="container mx-auto max-w-7xl bg-white px-4 py-8">
      <div className="mb-8 border-b-2 border-black pb-6">
        <p className="mb-1 font-body text-xs uppercase tracking-widest text-yuni-terracotta-500">
          Collectivité · {DEFAULT_CITY}
        </p>
        <h1 className="font-display text-4xl font-bold text-yuni-slate-900">
          Vue territoriale
        </h1>
        <p className="mt-1 text-yuni-slate-500">
          Tableau de bord Smart City — temps réel
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NeuroKPI
              label="Vitalité globale"
              value={
                vitScore != null ? Math.round(vitScore).toString() : "—"
              }
              unit="/ 100"
              status={
                vitScore == null
                  ? "neutral"
                  : vitScore > 70
                    ? "ok"
                    : vitScore > 40
                      ? "warning"
                      : "critical"
              }
              trend={vitScore != null ? "up" : undefined}
            />
            <NeuroKPI
              label="Cache hit"
              value={
                health?.metrics?.cache_hit_rate != null
                  ? Math.round(health.metrics.cache_hit_rate * 100)
                  : "—"
              }
              unit="%"
              status="ok"
            />
            <NeuroKPI
              label="Latence P95"
              value={health?.metrics?.p95_latency_ms ?? "—"}
              unit="ms"
              status={
                (health?.metrics?.p95_latency_ms ?? 0) < 800
                  ? "ok"
                  : "warning"
              }
            />
            <NeuroKPI
              label="Erreurs"
              value={
                health?.metrics?.error_rate != null
                  ? (health.metrics.error_rate * 100).toFixed(1)
                  : "0.0"
              }
              unit="%"
              status={
                (health?.metrics?.error_rate ?? 0) < 0.02 ? "ok" : "critical"
              }
            />
          </div>

          <NeuroCard variant="raised">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-display text-xl font-bold"
                style={{ color: "#2D3748" }}
              >
                Vitalité par zones
              </h2>
              <Link
                href="/dashboard/zones"
                className="font-body text-xs text-yuni-terracotta-500 hover:underline"
              >
                Détail par zone →
              </Link>
            </div>
            {vitality?.zones?.length ? (
              <div className="space-y-3">
                {vitality.zones.map((zone) => (
                  <div key={zone.zone} className="flex items-center gap-3">
                    <span
                      className="w-28 shrink-0 capitalize font-body text-sm"
                      style={{ color: "#4A5568" }}
                    >
                      {zone.zone}
                    </span>
                    <div
                      className="h-2 flex-1 rounded-full"
                      style={{ background: "#D1CBC4" }}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                        style={{
                          width: `${zone.score ?? 0}%`,
                          background:
                            (zone.score ?? 0) > 70
                              ? "#2D6A4F"
                              : (zone.score ?? 0) > 40
                                ? "#D97706"
                                : "#C1440E",
                        }}
                      />
                    </div>
                    <span
                      className="w-8 shrink-0 text-right font-mono text-sm font-bold"
                      style={{ color: "#2D3748" }}
                    >
                      {zone.score != null ? Math.round(zone.score) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#4A5568" }}>
                Données de zones en cours de chargement…
              </p>
            )}
          </NeuroCard>

          <NeuroCard variant="flat">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="font-display text-lg font-bold"
                style={{ color: "#2D3748" }}
              >
                Boîte noire civile
              </h2>
              {audit == null ? (
                <span
                  className="rounded-full bg-yuni-wheat-100 px-2 py-1 text-xs font-medium text-yuni-slate-600"
                >
                  Connexion requise
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    audit.chain_valid
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {audit.chain_valid
                    ? "✓ Intégrité vérifiée"
                    : "⚠ À vérifier"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p style={{ color: "#4A5568" }}>Enregistrements</p>
                <p
                  className="font-mono text-lg font-bold"
                  style={{ color: "#2D3748" }}
                >
                  {audit?.records_count ?? "—"}
                </p>
              </div>
              <div>
                <p style={{ color: "#4A5568" }}>EU AI Act</p>
                <p className="text-sm font-bold" style={{ color: "#2D6A4F" }}>
                  ✓ Conforme
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/federation"
              className="mt-3 inline-block text-xs text-yuni-terracotta-500 hover:underline"
            >
              Voir le protocole ODBL + Fédération EU →
            </Link>
          </NeuroCard>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <NeuroCard variant="raised">
            <h3
              className="mb-3 font-body text-xs uppercase tracking-widest"
              style={{ color: "#4A5568" }}
            >
              Services
            </h3>
            <div className="space-y-2">
              <NeuroStatus
                label="Redis"
                status={mapHealthServiceToNeuro(health?.services?.redis)}
              />
              <NeuroStatus
                label="Qdrant"
                status={mapHealthServiceToNeuro(health?.services?.qdrant)}
              />
              <NeuroStatus
                label="Mistral"
                status={mapHealthServiceToNeuro(health?.services?.mistral)}
              />
            </div>
          </NeuroCard>

          <NeuroCard variant="flat">
            <h3
              className="mb-3 font-body text-xs uppercase tracking-widest"
              style={{ color: "#4A5568" }}
            >
              Accès rapide
            </h3>
            <div className="space-y-1">
              {[
                { label: "Vue globale", href: "/dashboard/overview" },
                { label: "Engagement", href: "/dashboard/engagement" },
                { label: "Export ODBL", href: "/dashboard/export" },
                { label: "Fédération EU", href: "/dashboard/federation" },
                { label: "Budget Mistral", href: "/admin/budget" },
                { label: "Admin panel", href: "/admin/overview" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg py-2 pl-3 pr-3 font-body text-sm transition-colors hover:bg-yuni-terracotta-500 hover:text-white"
                  style={{ color: "#2D3748" }}
                >
                  {item.label} →
                </Link>
              ))}
            </div>
          </NeuroCard>

          <div className="text-center">
            <p className="font-mono text-xs" style={{ color: "#4A5568" }}>
              Yuni AI {health?.version ?? "—"}
            </p>
            <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>
              {health?.environment ?? "dev"}
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-8 border-t border-yuni-wheat-300 pt-6">
        <Link
          href="/dashboard/overview"
          className="inline-flex items-center gap-2 rounded-sm bg-yuni-slate-900 px-8 py-3 font-body font-semibold text-white transition-colors hover:bg-yuni-terracotta-500"
        >
          Ouvrir le tableau de bord complet →
        </Link>
      </div>
    </main>
  );
}
