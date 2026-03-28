"use client";

import { cn } from "./utils";

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
  return (
    <div
      className={cn(
        "relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-yuni-terracotta-300 bg-yuni-terracotta-500/20 font-editorial text-2xl font-semibold text-yuni-slate-900",
        className,
      )}
      aria-label={name}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="select-none">{initials(name)}</span>
      )}
      <span
        className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-yuni-forest-500"
        title={`Niveau ${level}`}
      />
    </div>
  );
}
