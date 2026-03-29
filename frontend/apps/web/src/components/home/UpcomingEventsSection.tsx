import type { EventRecommendation } from "@yuni/api-client";

import { NewsCard, type NewsCardItem } from "@/components/home/NewsCard";

function toCard(e: EventRecommendation): NewsCardItem {
  return {
    id: `evt-${e.id}`,
    title: e.title,
    category: e.category,
    meta: `Événement · il y a peu`,
  };
}

export function UpcomingEventsSection({
  events,
}: {
  events: EventRecommendation[];
}) {
  const slice = events.slice(0, 3);
  if (slice.length === 0) {
    return (
      <section aria-labelledby="upcoming-events-heading">
        <h2
          id="upcoming-events-heading"
          className="font-display text-2xl font-bold text-yuni-slate-900"
        >
          À venir près de toi
        </h2>
        <hr className="mb-4 border-t-2 border-black" />
        <p className="text-sm text-yuni-slate-500">
          Aucun événement mis en avant pour le moment.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="upcoming-events-heading">
      <h2
        id="upcoming-events-heading"
        className="font-display text-2xl font-bold text-yuni-slate-900"
      >
        À venir près de toi
      </h2>
      <hr className="mb-4 border-t-2 border-black" />
      <div className="grid gap-6 md:grid-cols-3">
        {slice.map((e) => (
          <NewsCard key={e.id} item={toCard(e)} />
        ))}
      </div>
    </section>
  );
}
