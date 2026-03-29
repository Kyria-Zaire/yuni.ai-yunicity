export interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  color?: "positive" | "negative" | "neutral";
}

const trendArrow: Record<MetricCardProps["trend"], string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const borderAccent: Record<
  NonNullable<MetricCardProps["color"]> | "default",
  string
> = {
  positive: "border-t-yuni-forest-500",
  negative: "border-t-yuni-terracotta-500",
  neutral: "border-t-yuni-slate-500",
  default: "border-t-yuni-slate-300",
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  color = "neutral",
}: MetricCardProps) {
  const accent = color === "neutral" ? "default" : color;
  const trendColor =
    trend === "up"
      ? "text-yuni-forest-600"
      : trend === "down"
        ? "text-yuni-terracotta-600"
        : "text-yuni-slate-500";

  return (
    <div
      className={`border-t-[3px] bg-white px-3 py-4 shadow-yuni-sm ${borderAccent[accent]}`}
    >
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-yuni-slate-500">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold leading-none text-yuni-slate-900 md:text-5xl">
          {value}
        </span>
        <span className="font-body text-sm text-yuni-slate-500">{unit}</span>
        <span className={`ml-auto font-body text-lg ${trendColor}`} aria-hidden>
          {trendArrow[trend]}
        </span>
      </div>
    </div>
  );
}
