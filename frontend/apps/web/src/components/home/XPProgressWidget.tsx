"use client";

import { useXPProfile } from "@yuni/api-client/react";
import { XPBar } from "@yuni/ui";

export function XPProgressWidget() {
  const xp = useXPProfile(true);

  if (!xp.data) {
    return (
      <div className="border border-yuni-wheat-200 bg-white p-4">
        <p className="text-sm text-yuni-slate-500">Chargement XP…</p>
      </div>
    );
  }

  return (
    <div className="border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
      <h3 className="font-display text-base font-bold text-yuni-slate-900">
        Progression
      </h3>
      <div className="mt-3">
        <XPBar
          currentXp={xp.data.total_xp}
          nextLevelXp={xp.data.next_level_xp}
          levelLabel={`Niveau ${String(xp.data.level)}`}
        />
      </div>
    </div>
  );
}
