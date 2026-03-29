"use client";

import dynamic from "next/dynamic";

import { YuniCard } from "@yuni/ui";

import { DEFAULT_CITY } from "@/lib/constants";

const MapboxMap = dynamic(
  () =>
    import("@/components/map/MapboxMap").then((m) => ({ default: m.MapboxMap })),
  {
    ssr: false,
    loading: () => <p className="p-6 text-yuni-slate-600">Carte…</p>,
  },
);

const DEMO_ACTORS = [
  { id: "1", name: "Maison de la culture", category: "culture" },
  { id: "2", name: "Club sportif", category: "sport" },
  { id: "3", name: "Marché local", category: "commerce" },
] as const;

function MapActorsList() {
  return (
    <div className="w-full max-w-md space-y-3">
      {DEMO_ACTORS.map((actor) => (
        <YuniCard key={actor.id} variant="bordered">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-editorial text-lg text-yuni-slate-900">
                {actor.name}
              </p>
              <p className="text-sm text-yuni-slate-500">{actor.category}</p>
            </div>
            <span className="rounded-full bg-yuni-terracotta-50 px-2 py-1 font-body text-xs font-medium text-yuni-terracotta-700">
              {actor.category}
            </span>
          </div>
        </YuniCard>
      ))}
    </div>
  );
}

export default function MapPage() {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();

  if (!mapboxToken) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex min-h-96 flex-col items-center justify-center gap-6 p-8">
          <div className="space-y-2 text-center">
            <h2 className="font-editorial text-3xl text-yuni-slate-700">
              Carte de Reims
            </h2>
            <p className="max-w-md font-body text-yuni-slate-500">
              Configure{" "}
              <code className="rounded bg-yuni-wheat-100 px-1 font-mono text-sm text-yuni-slate-600">
                NEXT_PUBLIC_MAPBOX_TOKEN
              </code>{" "}
              pour afficher la carte interactive.
            </p>
          </div>
          <MapActorsList />
          <p className="text-xs text-yuni-slate-400">Ville : {DEFAULT_CITY}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-editorial text-3xl text-yuni-slate-900">
        Carte interactive
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-yuni-slate-600">
        Pins acteurs (démo), heatmap de vitalité, panneau latéral au clic.
        Filtre par nom — clustering à brancher sur données API.
      </p>
      <div className="mt-6">
        <MapboxMap />
      </div>
    </div>
  );
}
