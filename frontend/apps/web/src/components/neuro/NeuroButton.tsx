"use client";

interface NeuroButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

const COLORS = {
  primary: { bg: "#C1440E", text: "#FFFFFF" },
  danger: { bg: "#DC2626", text: "#FFFFFF" },
  ghost: { bg: "transparent", text: "#2D3748" },
} as const;

export function NeuroButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  loading,
}: NeuroButtonProps) {
  const c = COLORS[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-xl px-5 py-2.5 font-body text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yuni-terracotta-500 active:shadow-[inset_2px_2px_6px_#B8B4AF,inset_-2px_-2px_6px_#FFFFFF] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: variant === "ghost" ? "#E8E4DF" : c.bg,
        color: c.text,
        boxShadow:
          variant === "ghost"
            ? "4px 4px 8px #B8B4AF, -4px -4px 8px #FFFFFF"
            : "none",
      }}
    >
      {loading ? "Chargement…" : children}
    </button>
  );
}
