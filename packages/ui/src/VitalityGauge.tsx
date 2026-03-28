"use client";

import { motion } from "framer-motion";

import { cn } from "./utils";

export interface VitalityGaugeProps {
  score: number;
  grade: string;
  className?: string;
}

function colorForScore(s: number) {
  if (s > 70) {
    return "stroke-yuni-forest-500";
  }
  if (s >= 40) {
    return "stroke-yuni-wheat-500";
  }
  return "stroke-yuni-terracotta-500";
}

export function VitalityGauge({ score, grade, className }: VitalityGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Vitalité ${Math.round(clamped)} sur 100, grade ${grade}`}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          strokeWidth="10"
          className="stroke-yuni-wheat-100"
        />
        <motion.circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={colorForScore(clamped)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-editorial text-3xl text-yuni-slate-900">
          {Math.round(clamped)}
        </span>
        <span className="text-xs font-medium text-yuni-slate-600">{grade}</span>
      </div>
    </div>
  );
}
