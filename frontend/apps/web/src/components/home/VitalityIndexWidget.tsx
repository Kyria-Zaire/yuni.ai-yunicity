export interface VitalityZoneRow {
  name: string;
  score: number;
}

export interface VitalityIndexWidgetProps {
  score: number;
  zones: VitalityZoneRow[];
}

export function VitalityIndexWidget({ score, zones }: VitalityIndexWidgetProps) {
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="border-t-2 border-black pt-4">
      <h3 className="font-display text-lg font-bold text-yuni-slate-900">
        Indice de vitalité
      </h3>
      <hr className="mb-4 border-black" />
      <div className="relative mb-3 h-2 rounded-full bg-yuni-slate-100">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-yuni-forest-500 transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-yuni-forest-500 bg-white"
          style={{ left: `calc(${pct}% - 6px)` }}
          aria-hidden
        />
      </div>
      <div className="mb-4 flex justify-between text-xs text-yuni-slate-400">
        <span>Négatif</span>
        <span>Neutre</span>
        <span className="font-semibold text-yuni-forest-600">
          {score} Positif
        </span>
      </div>
      <ul className="space-y-0">
        {zones.map((zone) => (
          <li
            key={zone.name}
            className="flex items-center justify-between border-b border-yuni-slate-100 py-2 text-sm"
          >
            <span className="font-body text-yuni-slate-700">{zone.name}</span>
            <span
              className={`font-semibold ${
                zone.score > 70
                  ? "text-yuni-forest-600"
                  : zone.score > 40
                    ? "text-amber-600"
                    : "text-yuni-terracotta-600"
              }`}
            >
              {zone.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
