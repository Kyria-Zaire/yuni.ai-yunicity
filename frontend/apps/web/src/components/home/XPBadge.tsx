"use client";

import { useXPProfile } from "@yuni/api-client/react";

export function XPBadge({ compact }: { compact?: boolean }) {
  const xp = useXPProfile(true);
  const level = xp.data?.level ?? "—";
  const total = xp.data?.total_xp ?? 0;

  if (compact) {
    return (
      <div className="rounded-full bg-yuni-terracotta-500 px-3 py-1.5 text-xs font-bold text-white">
        {String(level)} · {total} XP
      </div>
    );
  }

  return (
    <div className="rounded-yuni-md border border-yuni-terracotta-300 bg-yuni-terracotta-50 px-4 py-2 text-sm font-semibold text-yuni-slate-900">
      Niveau {String(level)} · {total} XP
    </div>
  );
}
