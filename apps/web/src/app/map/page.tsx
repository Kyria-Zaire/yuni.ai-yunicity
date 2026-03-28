import dynamic from "next/dynamic";

const MapboxMap = dynamic(
  () =>
    import("@/components/map/MapboxMap").then((m) => ({ default: m.MapboxMap })),
  { ssr: false, loading: () => <p className="p-6 text-yuni-slate-600">Carte…</p> },
);

export default function MapPage() {
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
