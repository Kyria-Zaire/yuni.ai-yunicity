"use client";

import { NeuroCard } from "./NeuroCard";

export type NeuroServiceState =
  | "connected"
  | "available"
  | "ready"
  | "not_configured"
  | "error";

export interface NeuroStatusProps {
  label: string;
  status: NeuroServiceState;
}

const STATUS_MAP: Record<
  NeuroServiceState,
  { color: string; label: string; dot: string }
> = {
  connected: { color: "#2D6A4F", label: "connected", dot: "#40C97F" },
  available: { color: "#2D6A4F", label: "available", dot: "#40C97F" },
  ready: { color: "#2D6A4F", label: "ready", dot: "#40C97F" },
  not_configured: {
    color: "#D97706",
    label: "not configured",
    dot: "#FCD34D",
  },
  error: { color: "#C1440E", label: "error", dot: "#EF4444" },
};

/** Mappe une chaîne renvoyée par GET /health (services.*) vers un état Neuro. */
export function mapHealthServiceToNeuro(
  raw: string | undefined,
  fallback: NeuroServiceState = "not_configured",
): NeuroServiceState {
  if (!raw) {
    return fallback;
  }
  const r = raw.toLowerCase().trim();
  if (r === "connected") {
    return "connected";
  }
  if (r === "available") {
    return "available";
  }
  if (r === "ready") {
    return "ready";
  }
  if (r.includes("not_configured") || r === "not configured") {
    return "not_configured";
  }
  if (
    r.includes("error") ||
    r === "unavailable" ||
    r === "disconnected" ||
    r === "failed"
  ) {
    return "error";
  }
  return fallback;
}

export function NeuroStatus({ label, status }: NeuroStatusProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.not_configured;
  return (
    <NeuroCard variant="flat" className="flex items-center gap-3">
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ background: s.dot }}
      />
      <div>
        <p className="font-body text-sm font-semibold" style={{ color: "#2D3748" }}>
          {label}
        </p>
        <p className="font-mono text-xs" style={{ color: s.color }}>
          {s.label}
        </p>
      </div>
    </NeuroCard>
  );
}
