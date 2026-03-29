export interface BreakingBannerProps {
  message: string;
  timeLabel: string;
}

export function BreakingBanner({ message, timeLabel }: BreakingBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white"
      role="status"
      aria-live="polite"
    >
      <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase text-yuni-terracotta-500">
        En direct
      </span>
      <span className="min-w-0 flex-1">{message}</span>
      <span className="ml-auto text-xs opacity-90">{timeLabel}</span>
    </div>
  );
}
