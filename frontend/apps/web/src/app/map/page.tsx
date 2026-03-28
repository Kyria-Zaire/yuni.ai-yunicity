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

function MapActorsList({ city }: { city: string }) {
  return (
    <ul className="mt-4 w-full max-w-md space-y-2 text-left text-sm text-yuni-slate-700">
      {DEMO_ACTORS.map((a) => (
        <li
          key={a.id}
          className="rounded-yuni-md border border-yuni-wheat-100 bg-white px-3 py-2 shadow-yuni-sm"
        >
          <span className="font-medium">{a.name}</span>
          <span className="ml-2 text-yuni-slate-500">· {a.category}</span>
        </li>
      ))}
      <li className="pt-1 text-xs text-yuni-slate-400">Ville : {city}</li>
    </ul>
  );
}

export default function MapPage() {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim();

  if (!mapboxToken) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Carte interactive
        </h1>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-yuni-xl border border-yuni-wheat-100 bg-yuni-wheat-50/60 py-12">
          <div className="text-6xl" aria-hidden>
            🗺️
          </div>
          <p className="font-editorial text-2xl text-yuni-terracotta-500">
            Carte de Reims
          </p>
          <p className="max-w-md text-center text-sm text-yuni-slate-400">
            Configure{" "}
            <code className="rounded bg-yuni-wheat-100 px-1 font-mono text-yuni-slate-600">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            dans{" "}
            <code className="rounded bg-yuni-wheat-100 px-1 font-mono text-yuni-slate-600">
              .env.local
            </code>{" "}
            pour afficher la carte Mapbox (token public gratuit sur mapbox.com).
          </p>
          <MapActorsList city={DEFAULT_CITY} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
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
    </main>
  );
}
