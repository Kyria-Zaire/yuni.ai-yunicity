import type {
  ActorRecommendation,
  EventRecommendation,
  VitalityIndexResponse,
} from "@yuni/api-client";

import type { NewsCardItem } from "@/components/home/NewsCard";
import type { VitalityZoneRow } from "@/components/home/VitalityIndexWidget";

export function toError(e: unknown): Error | null {
  if (!e) {
    return null;
  }
  return e instanceof Error ? e : new Error(String(e));
}

export function zonesFromVitality(
  data: VitalityIndexResponse | undefined,
): VitalityZoneRow[] {
  if (!data) {
    return [{ name: "Centre-ville", score: 72 }];
  }
  const raw = data.dimensions;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ name: data.zone, score: Math.round(data.score) }];
  }
  const rows: VitalityZoneRow[] = [];
  for (const d of raw) {
    if (d && typeof d === "object" && "name" in d && "score" in d) {
      const o = d as Record<string, unknown>;
      const name = String(o.name);
      const score = Number(o.score);
      if (!Number.isNaN(score)) {
        rows.push({ name, score: Math.round(score) });
      }
    }
  }
  return rows.length > 0
    ? rows.slice(0, 5)
    : [{ name: data.zone, score: Math.round(data.score) }];
}

export function buildNewsItems(
  actors: ActorRecommendation[],
  events: EventRecommendation[],
): NewsCardItem[] {
  const fromActors = actors.slice(0, 3).map((a) => ({
    id: `actor-${a.id}`,
    title: a.name,
    category: a.category,
    meta: `${a.distance_km != null ? `${a.distance_km.toFixed(1)} km` : "—"} · score ${a.score.toFixed(2)}`,
    sentiment: { firstPct: 43 },
  }));
  const need = 3 - fromActors.length;
  const fromEvents = events.slice(0, Math.max(0, need)).map((e) => ({
    id: `event-${e.id}`,
    title: e.title,
    category: e.category,
    meta: "Événement · Yunicity",
    sentiment: { firstPct: 40 },
  }));
  return [...fromActors, ...fromEvents];
}
