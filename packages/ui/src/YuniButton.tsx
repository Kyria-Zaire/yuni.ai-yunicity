"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "./utils";

const variants = {
  primary: "bg-yuni-terracotta-500 text-white hover:bg-yuni-terracotta-700",
  secondary: "bg-yuni-slate-500 text-white hover:bg-yuni-slate-700",
  ghost: "bg-transparent text-yuni-slate-700 hover:bg-yuni-wheat-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export interface YuniButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const YuniButton = forwardRef<HTMLButtonElement, YuniButtonProps>(
  function YuniButton(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled ?? loading}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-yuni-md font-medium transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuni-terracotta-500 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            aria-hidden
          />
        ) : null}
        {children}
      </button>
    );
  },
);
