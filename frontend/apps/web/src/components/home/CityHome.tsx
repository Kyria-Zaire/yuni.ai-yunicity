"use client";

import Link from "next/link";

import { useDashboardVitality } from "@yuni/api-client/react";
import { SkeletonCard, YuniCard } from "@yuni/ui";

import { toError } from "@/components/home/homeHelpers";
import { DEFAULT_CITY } from "@/lib/constants";

export function CityHome() {
  const dash = useDashboardVitality(DEFAULT_CITY, true);

  return (
    <div className="bg-[var(--surface-page)] pb-16 pt-8">
      <div className="container mx-auto max-w-7xl px-4">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-yuni-terracotta-600">
          Collectivité
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-yuni-slate-900">
          Vue territoriale
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-yuni-slate-600">
          Vitalité par zones, signalements agrégés et exports ODbL — pilotage
          ville.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <SkeletonCard
            isLoading={dash.isPending}
            error={dash.isError ? toError(dash.error) : null}
            empty={!dash.data?.zones?.length}
            emptyMessage="Aucune donnée dashboard vitalité."
          >
            <YuniCard variant="elevated" header="Vitalité · zones">
              <ul className="space-y-2 text-sm">
                {(dash.data?.zones ?? []).slice(0, 6).map((z) => (
                  <li
                    key={z.zone}
                    className="flex justify-between border-b border-yuni-wheat-100 py-1"
                  >
                    <span>{z.zone}</span>
                    <span className="font-semibold text-yuni-forest-700">
                      {typeof z.score === "number" ? z.score.toFixed(1) : z.score}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/zones"
                className="mt-4 inline-block text-sm font-semibold text-yuni-terracotta-600 underline"
              >
                Détail par zone →
              </Link>
            </YuniCard>
          </SkeletonCard>

          <YuniCard variant="elevated" header="Accès rapide">
            <ul className="space-y-3 font-body text-sm">
              <li>
                <Link
                  href="/dashboard/overview"
                  className="font-medium text-yuni-terracotta-700 hover:underline"
                >
                  Vue globale
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/engagement"
                  className="font-medium text-yuni-terracotta-700 hover:underline"
                >
                  Engagement
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/export"
                  className="font-medium text-yuni-terracotta-700 hover:underline"
                >
                  Export ODBL
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/federation"
                  className="font-medium text-yuni-terracotta-700 hover:underline"
                >
                  Fédération EU
                </Link>
              </li>
            </ul>
          </YuniCard>
        </div>

        <div className="mt-10">
          <Link
            href="/dashboard/overview"
            className="inline-flex min-h-[44px] items-center justify-center rounded-yuni-md bg-yuni-slate-900 px-8 py-3 font-body text-sm font-semibold text-white hover:bg-yuni-terracotta-700"
          >
            Ouvrir le tableau de bord ville
          </Link>
        </div>
      </div>
    </div>
  );
}
