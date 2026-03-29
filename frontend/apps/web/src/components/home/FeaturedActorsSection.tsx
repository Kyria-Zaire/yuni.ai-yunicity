import type { ActorRecommendation } from "@yuni/api-client";

import { NewsCard, type NewsCardItem } from "@/components/home/NewsCard";

function toCard(a: ActorRecommendation): NewsCardItem {
  return {
    id: `actor-${a.id}`,
    title: a.name,
    category: a.category,
    meta: `${a.distance_km != null ? `${a.distance_km.toFixed(1)} km` : "—"} · découverte`,
  };
}

export function FeaturedActorsSection({
  actors,
}: {
  actors: ActorRecommendation[];
}) {
  const slice = actors.slice(0, 3);
  if (slice.length === 0) {
    return (
      <section aria-labelledby="featured-actors-heading">
        <h2
          id="featured-actors-heading"
          className="font-display text-2xl font-bold text-yuni-slate-900"
        >
          Acteurs à découvrir
        </h2>
        <hr className="mb-4 border-t-2 border-black" />
        <p className="text-sm text-yuni-slate-500">
          Aucun acteur mis en avant — connecte-toi pour des recommandations.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-actors-heading">
      <h2
        id="featured-actors-heading"
        className="font-display text-2xl font-bold text-yuni-slate-900"
      >
        Acteurs à découvrir
      </h2>
      <hr className="mb-4 border-t-2 border-black" />
      <div className="grid gap-6 md:grid-cols-3">
        {slice.map((a) => (
          <NewsCard key={a.id} item={toCard(a)} />
        ))}
      </div>
    </section>
  );
}
