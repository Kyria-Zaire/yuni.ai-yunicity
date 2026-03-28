"use client";

import { motion } from "framer-motion";

import { cn } from "./utils";

export interface XPBarProps {
  currentXp: number;
  nextLevelXp: number;
  levelLabel: string;
  className?: string;
}

export function XPBar({
  currentXp,
  nextLevelXp,
  levelLabel,
  className,
}: XPBarProps) {
  const pct =
    nextLevelXp > 0 ? Math.min(100, (currentXp / nextLevelXp) * 100) : 100;

  return (
    <div
      className={cn("w-full space-y-1", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progression XP — ${levelLabel}`}
      aria-valuetext={`${currentXp} sur ${nextLevelXp} XP`}
    >
      <div className="flex justify-between text-xs text-yuni-slate-600">
        <span>{levelLabel}</span>
        <span>
          {currentXp} / {nextLevelXp} XP
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-yuni-wheat-100">
        <motion.div
          className="h-full rounded-full bg-yuni-forest-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  );
}
