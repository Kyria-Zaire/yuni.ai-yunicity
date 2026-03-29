"use client";

import Link from "next/link";

import { YuniCard } from "@yuni/ui";

export function MerchantHome() {
  return (
    <div className="bg-[var(--surface-page)] pb-16 pt-8">
      <div className="container mx-auto max-w-7xl px-4">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-yuni-terracotta-600">
          Espace Pro
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-yuni-slate-900">
          Dashboard métier
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-yuni-slate-600">
          Métriques, générateur IA et événements — pilote ta présence locale.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <YuniCard variant="elevated" header="Contenu IA">
            <p className="text-sm text-yuni-slate-600">
              Posts, newsletters, offres — génération guidée par thème.
            </p>
            <Link
              href="/merchant"
              className="mt-4 inline-block text-sm font-semibold text-yuni-terracotta-600 underline"
            >
              Ouvrir le générateur →
            </Link>
          </YuniCard>
          <YuniCard variant="elevated" header="Événements">
            <p className="text-sm text-yuni-slate-600">
              Annonce tes soirées et ateliers pour le quartier.
            </p>
            <Link
              href="/merchant"
              className="mt-4 inline-block text-sm font-semibold text-yuni-terracotta-600 underline"
            >
              Gérer →
            </Link>
          </YuniCard>
          <YuniCard variant="elevated" header="Performance">
            <p className="text-sm text-yuni-slate-600">
              Suivi des interactions (à brancher sur les métriques API).
            </p>
            <Link
              href="/merchant"
              className="mt-4 inline-block text-sm font-semibold text-yuni-terracotta-600 underline"
            >
              Voir le tableau →
            </Link>
          </YuniCard>
        </div>

        <div className="mt-10">
          <Link
            href="/merchant"
            className="inline-flex min-h-[44px] items-center justify-center rounded-yuni-md bg-yuni-slate-900 px-8 py-3 font-body text-sm font-semibold text-white hover:bg-yuni-terracotta-700"
          >
            Accéder au dashboard commerçant
          </Link>
        </div>
      </div>
    </div>
  );
}
