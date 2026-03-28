"use client";

import { cn } from "./utils";

const levelColors: Record<number, string> = {
  1: "bg-yuni-wheat-300",
  2: "bg-yuni-slate-300",
  3: "bg-yuni-forest-300",
  4: "bg-yuni-terracotta-300",
  5: "bg-yuni-aiPulse",
};

export interface YuniAvatarProps {
  name: string;
  imageUrl?: string | null;
  /** 1–5 niveau citoyen affiché */
  level?: number;
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function YuniAvatar({
  name,
  imageUrl,
  level = 1,
  className,
}: YuniAvatarProps) {
  const ring = levelColors[Math.min(5, Math.max(1, level))] ?? levelColors[1];
  return (
    <div
      className={cn(
        "relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-yuni-slate-900",
        ring,
        className,
      )}
      aria-label={name}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
      <span
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-yuni-forest-500"
        title={`Niveau ${level}`}
      />
    </div>
  );
}
