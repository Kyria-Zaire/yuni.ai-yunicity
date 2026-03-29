import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type YuniButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type YuniButtonSize = "sm" | "md" | "lg";

export interface YuniButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: YuniButtonVariant;
  size?: YuniButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuni-terracotta-500 focus-visible:ring-offset-2 focus-visible:ring-offset-yuni-wheat-50 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<YuniButtonVariant, string> = {
  primary:
    "bg-yuni-terracotta-500 text-white shadow-yuni-sm hover:bg-yuni-terracotta-700 hover:shadow-yuni-md",
  secondary:
    "border-2 border-yuni-terracotta-500 bg-white text-yuni-terracotta-500 hover:bg-yuni-terracotta-50",
  ghost:
    "bg-transparent text-yuni-slate-700 hover:bg-yuni-wheat-100",
  danger: "bg-red-600 text-white shadow-yuni-sm hover:bg-red-700 hover:shadow-yuni-md",
};

const sizes: Record<YuniButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-3.5 text-lg",
};

export function YuniButton({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: YuniButtonProps) {
  /* Ne pas désactiver un submit pendant loading : sinon le navigateur peut annuler l’envoi du formulaire (RHF + isSubmitting). */
  const isDisabled = Boolean(
    disabled || (loading && type !== "submit"),
  );

  return (
    <button
      type={type}
      className={twMerge(clsx(base, variants[variant], sizes[size]), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          <span>Chargement…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
