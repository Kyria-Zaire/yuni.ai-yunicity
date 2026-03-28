import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes, ReactNode } from "react";

export type YuniCardVariant = "default" | "elevated" | "bordered" | "featured";

export interface YuniCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: YuniCardVariant;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<YuniCardVariant, string> = {
  default:
    "rounded-lg border border-yuni-wheat-300/60 bg-white shadow-yuni-sm transition-shadow duration-200 hover:shadow-yuni-md",
  elevated:
    "rounded-lg border border-yuni-wheat-300/60 bg-white shadow-yuni-md transition-shadow duration-200 hover:shadow-yuni-lg",
  bordered:
    "rounded-lg border-2 border-yuni-terracotta-100 bg-white shadow-none",
  featured:
    "rounded-lg border border-yuni-wheat-300/60 border-l-4 border-l-yuni-terracotta-500 bg-white pl-4 shadow-yuni-sm transition-shadow duration-200 hover:shadow-yuni-md",
};

export function YuniCard({
  variant = "default",
  header,
  footer,
  className,
  children,
  ...rest
}: YuniCardProps) {
  return (
    <div
      className={twMerge(
        clsx("flex flex-col overflow-hidden", variantClasses[variant]),
        className,
      )}
      {...rest}
    >
      {header ? (
        <div className="border-b border-yuni-wheat-300/50 px-4 py-3 font-body text-sm font-medium text-yuni-slate-700">
          {header}
        </div>
      ) : null}
      <div className="flex-1 px-4 py-4">{children}</div>
      {footer ? (
        <div className="border-t border-yuni-wheat-300/50 px-4 py-3 text-sm text-yuni-slate-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
