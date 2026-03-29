import type {
  ActorRecommendation,
  EventRecommendation,
  VitalityIndexResponse,
} from "@yuni/api-client";

import type { NewsCardItem } from "@/components/home/NewsCard";
import type { VitalityZoneRow } from "@/components/home/VitalityIndexWidget";

export const DEMO_NEWS_ITEMS: NewsCardItem[] = [
  {
    id: "1",
    category: "Smart City",
    title: "Vitalité et vie locale — pilote Reims",
    meta:
      "Le projet Yuni AI mesure en temps réel l'engagement citoyen dans les quartiers rémois.",
    magazine: true,
    tags: "Smart City · Territoire",
    coveragePct: 43,
    sourcesCount: 12,
    timeAgo: "Il y a 12 min",
    region: "France",
    categoryColor: "#C1440E",
    bgGradient: "from-yuni-slate-700 to-yuni-slate-900",
  },
  {
    id: "2",
    category: "Parcours",
    title: "Quêtes urbaines et voix citoyenne",
    meta:
      "Explorez Reims à travers des défis géolocalisés et gagnez de l'XP.",
    magazine: true,
    tags: "Parcours · Citoyenneté",
    coveragePct: 58,
    sourcesCount: 9,
    timeAgo: "Il y a 1 h",
    region: "Grand Est",
    categoryColor: "#2D6A4F",
    bgGradient: "from-yuni-forest-700 to-yuni-slate-900",
  },
  {
    id: "3",
    category: "Explorer",
    title: "Carte interactive et recommandations",
    meta:
      "Découvrez les acteurs locaux recommandés par l'IA territoriale Yuni.",
    magazine: true,
    tags: "Explorer · Données locales",
    coveragePct: 36,
    sourcesCount: 15,
    timeAgo: "Il y a 2 h",
    region: "Reims",
    categoryColor: "#4A6FA5",
    bgGradient: "from-yuni-slate-600 to-yuni-slate-900",
  },
];

export const DEMO_EVENTS_FALLBACK: EventRecommendation[] = [
  {
    id: "demo-ev-1",
    title: "Marché de printemps — Place du Forum",
    actor_id: "demo",
    date: "Samedi 5 avril · 9h00 - 13h00",
    category: "Marché",
    reason: "Centre",
  },
  {
    id: "demo-ev-2",
    title: "Concert Jazz — Médiathèque Falala",
    actor_id: "demo",
    date: "Vendredi 4 avril · 20h30",
    category: "Culture",
    reason: "Centre",
  },
  {
    id: "demo-ev-3",
    title: "Atelier vélo — Collectif Mobilité",
    actor_id: "demo",
    date: "Dimanche 6 avril · 10h00 - 12h00",
    category: "Sport",
    reason: "Clairmarais",
  },
];

export const DEMO_ACTORS_FALLBACK: ActorRecommendation[] = [
  {
    id: "demo-act-1",
    name: "Boulangerie du Centre",
    category: "Commerce",
    distance_km: 0.4,
    reason: "Pain artisanal et viennoiseries depuis 1987.",
    score: 0.91,
  },
  {
    id: "demo-act-2",
    name: "Asso Vélo Reims",
    category: "Association",
    distance_km: 1.2,
    reason: "Promotion du vélo et mobilité douce.",
    score: 0.88,
  },
  {
    id: "demo-act-3",
    name: "Studio Photo Lumière",
    category: "Commerce",
    distance_km: 0.9,
    reason: "Portraits et reportages professionnels.",
    score: 0.85,
  },
];

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

function sourcesFromId(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) {
    n += id.charCodeAt(i);
  }
  return 8 + (n % 10);
}

export function buildNewsItems(
  actors: ActorRecommendation[],
  events: EventRecommendation[],
): NewsCardItem[] {
  const fromActors = actors.slice(0, 3).map((a) => {
    const id = `actor-${a.id}`;
    const pct = Math.min(
      95,
      Math.max(28, Math.round(35 + a.score * 40)),
    );
    return {
      id,
      title: a.name,
      category: a.category,
      meta: `${a.distance_km != null ? `${a.distance_km.toFixed(1)} km` : "—"} · score ${a.score.toFixed(2)}`,
      sentiment: { firstPct: pct },
      magazine: true,
      tags: `• ${a.category}, Recommandations`,
      coveragePct: pct,
      sourcesCount: sourcesFromId(id),
      timeAgo: "À l’instant",
      region: "France",
      bgGradient: "from-yuni-slate-600 to-yuni-slate-900",
    };
  });
  const need = 3 - fromActors.length;
  const fromEvents = events.slice(0, Math.max(0, need)).map((e) => {
    const id = `event-${e.id}`;
    return {
      id,
      title: e.title,
      category: e.category,
      meta: `${e.date} · ${e.reason}`,
      sentiment: { firstPct: 40 },
      magazine: true,
      tags: `• ${e.category}, Événements`,
      coveragePct: 40,
      sourcesCount: sourcesFromId(id),
      timeAgo: "Bientôt",
      region: "Grand Est",
      bgGradient: "from-yuni-terracotta-700 to-yuni-slate-900",
    };
  });
  return [...fromActors, ...fromEvents];
}
