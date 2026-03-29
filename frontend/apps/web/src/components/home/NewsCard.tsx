export interface NewsCardItem {
  id: string;
  title: string;
  category: string;
  meta: string;
  sentiment?: { firstPct: number };
}

const categoryTint: Record<string, string> = {
  culture: "bg-yuni-terracotta-100 text-yuni-terracotta-800",
  sport: "bg-yuni-forest-100 text-yuni-forest-800",
  commerce: "bg-yuni-wheat-100 text-yuni-slate-800",
  default: "bg-yuni-slate-100 text-yuni-slate-800",
};

const placeholderBg: Record<string, string> = {
  culture: "bg-yuni-terracotta-50",
  sport: "bg-yuni-forest-50",
  commerce: "bg-yuni-wheat-100",
  default: "bg-yuni-slate-50",
};

export function NewsCard({ item }: { item: NewsCardItem }) {
  const key = item.category.toLowerCase();
  const tint = categoryTint[key] ?? categoryTint.default;
  const ph = placeholderBg[key] ?? placeholderBg.default;
  const s = item.sentiment;

  return (
    <article className="flex flex-col overflow-hidden rounded-yuni-md border border-yuni-wheat-200 bg-white shadow-yuni-sm">
      <div className={`relative aspect-video w-full ${ph}`} aria-hidden>
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <span className="font-display text-4xl font-bold text-yuni-slate-400">
            {item.category.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${tint}`}
        >
          {item.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-lg font-bold leading-snug text-yuni-slate-900 line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-2 font-body text-xs text-yuni-slate-500">{item.meta}</p>
        {s ? (
          <div
            className="mt-3 flex h-1 overflow-hidden rounded-full bg-yuni-slate-100"
            aria-hidden
          >
            <div
              className="bg-yuni-terracotta-500"
              style={{ width: `${s.firstPct}%` }}
            />
            <div
              className="bg-yuni-slate-500"
              style={{ width: `${100 - s.firstPct}%` }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
