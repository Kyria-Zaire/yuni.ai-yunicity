"use client";

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

const variants = {
  default: "bg-yuni-wheat-50 border border-yuni-wheat-100",
  elevated: "bg-white shadow-yuni-md",
  bordered: "border-2 border-yuni-slate-100 bg-white",
} as const;

export interface YuniCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  header?: ReactNode;
  footer?: ReactNode;
}

export function YuniCard({
  className,
  variant = "default",
  header,
  footer,
  children,
  ...props
}: YuniCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-yuni-lg",
        variants[variant],
        className,
      )}
      {...props}
    >
      {header ? (
        <div className="border-b border-yuni-wheat-100 px-4 py-3 font-editorial text-lg text-yuni-slate-900">
          {header}
        </div>
      ) : null}
      <div className="px-4 py-4">{children}</div>
      {footer ? (
        <div className="border-t border-yuni-wheat-100 px-4 py-3 text-sm text-yuni-slate-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
