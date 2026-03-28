"use client";

import { motion } from "framer-motion";

import { cn } from "./utils";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface VoiceButtonProps {
  state: VoiceState;
  onPress?: () => void;
  className?: string;
}

const labels: Record<VoiceState, string> = {
  idle: "Hey Yuni",
  listening: "J’écoute…",
  processing: "Réflexion…",
  speaking: "Yuni parle",
};

export function VoiceButton({ state, onPress, className }: VoiceButtonProps) {
  const active = state !== "idle";
  const ariaLabel =
    state === "idle" ? "Activer Hey Yuni" : labels[state];

  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "relative flex h-16 w-16 items-center justify-center rounded-full font-body text-xs font-semibold text-white shadow-yuni-terracotta-glow",
        "bg-gradient-to-br from-yuni-terracotta-500 to-yuni-aiPulse",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuni-aiPulse focus-visible:ring-offset-2",
        className,
      )}
      animate={
        active
          ? { scale: [1, 1.06, 1], boxShadow: "0 0 24px rgba(107,140,255,0.45)" }
          : { scale: 1 }
      }
      transition={{ repeat: active ? Infinity : 0, duration: 1.4 }}
    >
      <span className="px-1 text-center leading-tight">{labels[state]}</span>
    </motion.button>
  );
}
