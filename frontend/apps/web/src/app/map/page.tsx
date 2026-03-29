"use client";

import dynamic from "next/dynamic";

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

export default function MapPage() {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();

  if (!mapboxToken) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex min-h-96 flex-col items-center justify-center gap-6 rounded-yuni-lg bg-yuni-slate-900 p-8 text-white">
          <div className="text-center">
            <p className="mb-4 text-6xl" aria-hidden>
              🗺️
            </p>
            <h1 className="font-display text-3xl font-bold text-white">
              Carte de Reims
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-yuni-slate-300">
              La carte interactive avec les acteurs locaux, la heatmap de
              vitalité et les quêtes géolocalisées sera disponible après
              configuration du token Mapbox.
            </p>
          </div>

          <div className="w-full max-w-lg space-y-2">
            <p className="mb-3 text-xs uppercase tracking-wider text-yuni-slate-400">
              Acteurs près de toi
            </p>
            {DEMO_ACTORS.map((actor) => (
              <div
                key={actor.id}
                className="flex items-center justify-between rounded-yuni-md bg-white/10 px-4 py-3"
              >
                <div>
                  <p className="font-body font-medium text-white">
                    {actor.name}
                  </p>
                  <p className="text-xs text-yuni-slate-400">{actor.category}</p>
                </div>
                <span className="rounded-full bg-yuni-terracotta-500 px-2 py-1 text-xs text-white">
                  {actor.category}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-yuni-slate-500">
            Ville : {DEFAULT_CITY} · configure{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>
          </p>
          <a
            href="https://account.mapbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yuni-slate-400 underline hover:text-white"
          >
            Configurer Mapbox →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-display text-3xl text-yuni-slate-900">
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
