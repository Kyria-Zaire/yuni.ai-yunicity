"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "./utils";

export interface VitalityGaugeProps {
  score: number;
  grade: string;
  /** Tendance affichée (ex. hausse, baisse, stable) — texte libre ou mots-clés FR/EN. */
  trend?: string | null;
  className?: string;
}

function gradeBadgeClass(grade: string): string {
  const g = grade.trim().toUpperCase().charAt(0);
  if (g === "A") {
    return "bg-yuni-forest-50 text-yuni-forest-700 ring-1 ring-yuni-forest-300";
  }
  if (g === "B") {
    return "bg-yuni-slate-50 text-yuni-slate-700 ring-1 ring-yuni-slate-300";
  }
  if (g === "C") {
    return "bg-yuni-wheat-100 text-yuni-slate-700 ring-1 ring-yuni-wheat-300";
  }
  return "bg-yuni-terracotta-50 text-yuni-terracotta-900 ring-1 ring-yuni-terracotta-200";
}

type TrendKind = "up" | "flat" | "down";

function parseTrend(trend?: string | null): TrendKind {
  if (!trend) return "flat";
  const t = trend.toLowerCase();
  if (
    t.includes("hausse") ||
    t.includes("up") ||
    t.includes("↑") ||
    t.includes("haut")
  ) {
    return "up";
  }
  if (
    t.includes("baisse") ||
    t.includes("down") ||
    t.includes("↓") ||
    t.includes("bas")
  ) {
    return "down";
  }
  return "flat";
}

function TrendArrow({ kind }: { kind: TrendKind }) {
  const reduce = useReducedMotion();
  const symbol = kind === "up" ? "↑" : kind === "down" ? "↓" : "→";
  const color =
    kind === "up"
      ? "text-yuni-forest-500"
      : kind === "down"
        ? "text-yuni-terracotta-500"
        : "text-yuni-slate-500";

  return (
    <motion.span
      className={cn("inline-block text-xl font-body leading-none", color)}
      aria-hidden
      animate={
        reduce
          ? undefined
          : kind === "up"
            ? { y: [0, -3, 0] }
            : kind === "down"
              ? { y: [0, 3, 0] }
              : { x: [0, 2, 0] }
      }
      transition={
        reduce
          ? undefined
          : { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
      }
    >
      {symbol}
    </motion.span>
  );
}

export function VitalityGauge({
  score,
  grade,
  trend,
  className,
}: VitalityGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (clamped / 100) * circumference;
  const trendKind = parseTrend(trend);

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center gap-2",
        className,
      )}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Vitalité ${Math.round(clamped)} sur 100, grade ${grade}`}
    >
      <div className="relative inline-flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            strokeWidth="10"
            className="stroke-yuni-wheat-300"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-yuni-terracotta-500"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-editorial text-[48px] font-bold leading-none text-yuni-slate-900">
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-3 py-0.5 font-body text-xs font-semibold uppercase tracking-wide",
          gradeBadgeClass(grade),
        )}
      >
        {grade}
      </span>
      {trend ? (
        <div className="flex items-center gap-1.5 font-body text-sm text-yuni-slate-600">
          <TrendArrow kind={trendKind} />
          <span>{trend}</span>
        </div>
      ) : null}
    </div>
  );
}
