"use client";

import { NeuroCard } from "./NeuroCard";

export interface NeuroKPIProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: "ok" | "warning" | "critical" | "neutral";
  trend?: "up" | "down" | "stable";
}

const STATUS_COLORS = {
  ok: "#2D6A4F",
  warning: "#D97706",
  critical: "#C1440E",
  neutral: "#4A5568",
} as const;

const TREND_ICONS = {
  up: "↑",
  down: "↓",
  stable: "→",
} as const;

const TREND_LABELS: Record<NonNullable<NeuroKPIProps["trend"]>, string> = {
  up: "Hausse",
  down: "Baisse",
  stable: "Stable",
};

export function NeuroKPI({
  label,
  value,
  unit,
  status = "neutral",
  trend,
}: NeuroKPIProps) {
  return (
    <NeuroCard variant="raised">
      <p
        className="mb-2 font-body text-xs uppercase tracking-widest"
        style={{ color: "#4A5568" }}
      >
        {label}
      </p>
      <p
        className="mb-1 font-mono text-3xl font-bold leading-none"
        style={{
          color: "#2D3748",
          fontFamily: "var(--font-neuro-mono), ui-monospace, monospace",
        }}
      >
        {value}
        {unit ? (
          <span
            className="ml-1 text-base font-normal"
            style={{ color: "#4A5568" }}
          >
            {unit}
          </span>
        ) : null}
      </p>
      {trend ? (
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: STATUS_COLORS[status] }}
        >
          {TREND_ICONS[trend]} {TREND_LABELS[trend]}
        </p>
      ) : null}
    </NeuroCard>
  );
}
