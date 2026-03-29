"use client";

const TICKER_ITEMS = [
  {
    id: "1",
    label: "Vitalité quartiers · pilote Reims",
    category: "Smart City",
    color: "#C1440E",
    bgColor: "#FDF0EB",
    icon: "📊",
  },
  {
    id: "2",
    label: "Quête du jour · parcours cathédrale",
    category: "Quêtes",
    color: "#2D6A4F",
    bgColor: "#EBF5EE",
    icon: "🗺️",
  },
  {
    id: "3",
    label: "Carte interactive · acteurs locaux",
    category: "Découverte",
    color: "#4A6FA5",
    bgColor: "#F0F2F4",
    icon: "📍",
  },
  {
    id: "4",
    label: "Bulles & patrimoine · Reims en direct",
    category: "Culture",
    color: "#8B2F08",
    bgColor: "#FAD5C4",
    icon: "🏛️",
  },
  {
    id: "5",
    label: "L'info locale sans filtre algo",
    category: "Média",
    color: "#1A2C47",
    bgColor: "#D4DAE2",
    icon: "📰",
  },
];

export function NewsTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="w-full overflow-hidden border-b border-yuni-wheat-300"
      style={{ background: "#FFFFFF", height: "44px" }}
      aria-label="Actualités en direct"
      role="marquee"
    >
      <div className="flex h-full items-center">
        <div
          className="flex h-full flex-shrink-0 items-center gap-2 border-r border-yuni-wheat-300 px-4"
          style={{ background: "#C1440E", minWidth: "fit-content" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
          <span className="whitespace-nowrap font-body text-xs font-bold uppercase tracking-widest text-white">
            En direct
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex w-max items-center gap-0 animate-ticker motion-reduce:animate-none"
          >
            {items.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="flex h-[44px] flex-shrink-0 cursor-pointer items-center gap-3 border-r border-yuni-wheat-200 px-6 transition-colors hover:bg-yuni-wheat-50"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm text-sm"
                  style={{ background: item.bgColor }}
                  aria-hidden
                >
                  {item.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="whitespace-nowrap font-body text-xs font-semibold uppercase tracking-wider"
                    style={{ color: item.color }}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    ·
                  </span>
                  <span className="whitespace-nowrap font-body text-xs text-yuni-slate-700">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
