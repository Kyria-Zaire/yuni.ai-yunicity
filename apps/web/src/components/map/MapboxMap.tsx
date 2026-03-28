"use client";

import { useMemo, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl";

import { YuniButton, YuniCard } from "@yuni/ui";

import { DEFAULT_CITY } from "@/lib/constants";

import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type Pt = {
  id: string;
  name: string;
  cat: "culture" | "sport" | "commerce";
  lng: number;
  lat: number;
};

const MOCK_ACTORS: Pt[] = [
  { id: "1", name: "Maison de la culture", cat: "culture", lng: 4.0317, lat: 49.2583 },
  { id: "2", name: "Club sportif", cat: "sport", lng: 4.04, lat: 49.25 },
  { id: "3", name: "Marché local", cat: "commerce", lng: 4.02, lat: 49.255 },
];

const HEAT_POINTS: { lng: number; lat: number; w: number }[] = [
  { lng: 4.0317, lat: 49.2583, w: 1 },
  { lng: 4.035, lat: 49.252, w: 0.6 },
  { lng: 4.028, lat: 49.262, w: 0.4 },
];

const catColor: Record<Pt["cat"], string> = {
  culture: "#4A6FA5",
  sport: "#2D6A4F",
  commerce: "#C1440E",
};

export function MapboxMap() {
  const [selected, setSelected] = useState<Pt | null>(null);
  const [filter, setFilter] = useState("");

  const actors = useMemo(() => {
    if (!filter.trim()) {
      return MOCK_ACTORS;
    }
    return MOCK_ACTORS.filter((a) =>
      a.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [filter]);

  const heatGeo = useMemo(
    () =>
      ({
        type: "FeatureCollection",
        features: HEAT_POINTS.map((p, i) => ({
          type: "Feature" as const,
          id: `h${i}`,
          properties: { weight: p.w },
          geometry: {
            type: "Point" as const,
            coordinates: [p.lng, p.lat],
          },
        })),
      }),
    [],
  );

  if (!TOKEN) {
    return (
      <YuniCard className="max-w-lg">
        <p className="text-sm text-yuni-slate-700">
          Définis <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
          dans <code className="font-mono">.env.local</code> pour afficher la
          carte Mapbox.
        </p>
      </YuniCard>
    );
  }

  return (
    <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden rounded-yuni-lg border border-yuni-wheat-100 shadow-yuni-md">
      <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Chercher sur la carte"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-[200px] flex-1 rounded-yuni-md border border-yuni-wheat-100 bg-white/95 px-3 py-2 text-sm shadow-yuni-sm"
          aria-label="Recherche sur la carte"
        />
      </div>
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{
          longitude: 4.0317,
          latitude: 49.2583,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" />
        <Source id="heat" type="geojson" data={heatGeo}>
          <Layer
            id="heat-layer"
            type="heatmap"
            paint={{
              "heatmap-weight": ["get", "weight"],
              "heatmap-intensity": 0.6,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(193,68,14,0)",
                0.4,
                "rgba(193,68,14,0.35)",
                1,
                "rgba(45,106,79,0.55)",
              ],
              "heatmap-radius": 40,
              "heatmap-opacity": 0.65,
            }}
          />
        </Source>
        {actors.map((a) => (
          <Marker
            key={a.id}
            longitude={a.lng}
            latitude={a.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(a);
            }}
          >
            <div
              className="h-4 w-4 cursor-pointer rounded-full border-2 border-white shadow-yuni-sm"
              style={{ background: catColor[a.cat] }}
            />
          </Marker>
        ))}
      </Map>
      {selected ? (
        <div className="absolute bottom-0 right-0 z-10 w-full max-w-sm p-4 md:w-96">
          <YuniCard
            variant="elevated"
            header={selected.cat}
            footer={
              <YuniButton size="sm" variant="secondary">
                Itinéraire
              </YuniButton>
            }
          >
            <p className="font-medium text-yuni-slate-900">{selected.name}</p>
            <p className="mt-2 text-sm text-yuni-slate-600">
              Recommandation IA : correspond à tes centres d’intérêt locaux.
            </p>
          </YuniCard>
        </div>
      ) : null}
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-yuni-sm bg-white/80 px-2 py-1 text-xs text-yuni-slate-500">
        {DEFAULT_CITY} · heatmap vitalité (démo)
      </p>
    </div>
  );
}
