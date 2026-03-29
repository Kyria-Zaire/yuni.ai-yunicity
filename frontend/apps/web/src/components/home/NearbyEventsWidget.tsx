"use client";

import type { EventRecommendation } from "@yuni/api-client";

export function NearbyEventsWidget({
  events,
}: {
  events: EventRecommendation[];
}) {
  const slice = events.slice(0, 5);

  return (
    <div className="border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
      <h3 className="font-display text-base font-bold text-yuni-slate-900">
        Événements près de toi
      </h3>
      {slice.length === 0 ? (
        <p className="mt-2 text-sm text-yuni-slate-500">
          Aucun événement dans les recommandations.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {slice.map((e) => (
            <li key={e.id} className="border-b border-yuni-wheat-100 pb-2">
              <span className="font-medium text-yuni-slate-800">{e.title}</span>
              <p className="text-xs text-yuni-slate-500">{e.category}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
