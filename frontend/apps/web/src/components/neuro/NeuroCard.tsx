"use client";

interface NeuroCardProps {
  children: React.ReactNode;
  variant?: "raised" | "inset" | "flat";
  className?: string;
}

const SHADOWS: Record<NonNullable<NeuroCardProps["variant"]>, string> = {
  raised:
    "shadow-[6px_6px_12px_#B8B4AF,-6px_-6px_12px_#FFFFFF]",
  inset:
    "shadow-[inset_4px_4px_8px_#B8B4AF,inset_-4px_-4px_8px_#FFFFFF]",
  flat: "shadow-[2px_2px_6px_#B8B4AF,-2px_-2px_6px_#FFFFFF]",
};

export function NeuroCard({
  children,
  variant = "raised",
  className = "",
}: NeuroCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 ${SHADOWS[variant]} ${className}`}
      style={{ background: "#E8E4DF" }}
    >
      {children}
    </div>
  );
}
