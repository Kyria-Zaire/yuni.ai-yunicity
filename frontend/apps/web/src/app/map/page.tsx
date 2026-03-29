"use client";

import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useState } from "react";

import { useActors } from "@yuni/api-client/react";

import { DEFAULT_CITY } from "@/lib/constants";

const REIMS_CENTER = { lat: 49.2583, lng: 4.0317 };

const CATEGORY_COLORS: Record<string, string> = {
  sport: "#2D6A4F",
  culture: "#4A6FA5",
  environnement: "#72B885",
  famille: "#F0946A",
  tech: "#6B8CFF",
  commerce: "#8B7355",
  default: "#C1440E",
};

export default function MapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading } = useActors(DEFAULT_CITY);
  const actors = data?.actors ?? [];
  const googleKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "").trim();
  const mapId =
    (process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "yuni-reims").trim() ||
    "yuni-reims";

  const selectedActor =
    selected && data?.actors
      ? data.actors.find((a) => a.id === selected)
      : undefined;

  if (!googleKey) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-yuni-lg bg-yuni-slate-900 p-8 text-center text-white">
          <p className="text-5xl" aria-hidden>
            🗺️
          </p>
          <h1 className="font-display text-3xl font-bold">Carte de Reims</h1>
          <p className="max-w-sm text-sm text-yuni-slate-300">
            Ajoute{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_KEY
            </code>{" "}
            dans{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              .env.local
            </code>{" "}
            (Google Cloud Console → Maps JavaScript API → Credentials).
          </p>
          {actors.slice(0, 5).map((a) => (
            <div
              key={a.id}
              className="flex w-full max-w-sm justify-between rounded-yuni-md bg-white/10 px-4 py-2 text-sm"
            >
              <span>{a.name}</span>
              <span className="text-yuni-terracotta-300">{a.category}</span>
            </div>
          ))}
          <a
            href="https://console.cloud.google.com/google/maps-apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yuni-slate-400 underline hover:text-white"
          >
            Configurer Google Maps →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-yuni-slate-900">
          Carte interactive
        </h1>
        <p className="mt-1 text-sm text-yuni-slate-500">
          {actors.length} acteurs · Reims
        </p>
      </div>

      <div className="h-[70vh] overflow-hidden rounded-yuni-lg border border-yuni-wheat-300">
        <APIProvider apiKey={googleKey}>
          <Map
            defaultCenter={REIMS_CENTER}
            defaultZoom={13}
            mapId={mapId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {actors.map((actor) => {
              const color =
                CATEGORY_COLORS[actor.category] ?? CATEGORY_COLORS.default;
              const lat = actor.geo?.lat ?? REIMS_CENTER.lat;
              const lng = actor.geo?.lng ?? REIMS_CENTER.lng;
              return (
                <AdvancedMarker
                  key={actor.id}
                  position={{ lat, lng }}
                  onClick={() => setSelected(actor.id)}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: color,
                      border: "2px solid white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    {actor.name.charAt(0).toUpperCase()}
                  </div>
                </AdvancedMarker>
              );
            })}

            {selectedActor ? (
              <InfoWindow
                position={{
                  lat: selectedActor.geo?.lat ?? REIMS_CENTER.lat,
                  lng: selectedActor.geo?.lng ?? REIMS_CENTER.lng,
                }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="min-w-40 p-2">
                  <p className="font-body font-semibold text-slate-900">
                    {selectedActor.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedActor.category}
                  </p>
                  <Link
                    href={`/feed?actor=${encodeURIComponent(selectedActor.id)}`}
                    className="mt-2 block text-xs text-yuni-terracotta-600 hover:underline"
                  >
                    Voir les recommandations →
                  </Link>
                </div>
              </InfoWindow>
            ) : null}
          </Map>
        </APIProvider>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-yuni-slate-400">
          Chargement des acteurs…
        </p>
      ) : null}
    </div>
  );
}
