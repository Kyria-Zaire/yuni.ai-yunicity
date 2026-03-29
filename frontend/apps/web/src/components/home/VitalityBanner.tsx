"use client";

import { useVitality } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

import { DEFAULT_ZONE } from "@/lib/constants";

function cityLabel(slug: string): string {
  if (!slug) {
    return "";
  }
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function VitalityBanner({ citySlug }: { citySlug: string }) {
  const { token } = useAuth();
  const vitality = useVitality(citySlug, DEFAULT_ZONE, Boolean(token));
  const score = vitality.data?.data?.score;
  const zone = vitality.data?.data?.zone ?? DEFAULT_ZONE;
  const rounded =
    typeof score === "number" ? Math.round(score) : null;
  const sentiment =
    rounded == null
      ? "—"
      : rounded >= 60
        ? "Positif"
        : rounded >= 40
          ? "Neutre"
          : "À surveiller";

  return (
    <div
      className="sticky top-[1px] z-30 border-b border-yuni-terracotta-300/40 bg-yuni-terracotta-500/10 px-4 py-2 text-center text-sm font-medium text-yuni-slate-800"
      role="status"
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span aria-hidden>●</span>
        Score vitalité {cityLabel(citySlug)} :{" "}
        {rounded != null ? `${rounded}/100` : "—"} · {sentiment} · {zone}
        {!token ? (
          <span className="text-xs text-yuni-slate-500">
            (connecte-toi pour les données live)
          </span>
        ) : null}
      </span>
    </div>
  );
}
