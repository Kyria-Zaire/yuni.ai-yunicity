import { Bookmark } from "lucide-react";

export interface NewsCardItem {
  id: string;
  title: string;
  category: string;
  meta: string;
  sentiment?: { firstPct: number };
  /**
   * Style « pleine page » type fil d’info : tags, titre, barre de couverture, visuel.
   * Si absent ou false, affiche la carte compacte historique (image en haut).
   */
  magazine?: boolean;
  /** Ligne de tags en tête (ex. « Smart City, Territoire ») */
  tags?: string;
  /** Part gauche de la barre (0–100), ex. couverture « centre » */
  coveragePct?: number;
  sourcesCount?: number;
  timeAgo?: string;
  region?: string;
  imageUrl?: string;
  /** Classes Tailwind pour `bg-gradient-to-br` (sans le préfixe) */
  bgGradient?: string;
  /** Accent catégorie (badges, etc.) */
  categoryColor?: string;
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

function MagazineCard({ item }: { item: NewsCardItem }) {
  const leftPct = Math.min(
    100,
    Math.max(
      0,
      item.coveragePct ??
        item.sentiment?.firstPct ??
        50,
    ),
  );
  const rightPct = 100 - leftPct;
  const sources = item.sourcesCount ?? 8;
  const tags =
    item.tags ??
    `• ${item.category}, ${item.meta.split("·")[0]?.trim() ?? "Yuni AI"}`;
  const time = item.timeAgo ?? "À l’instant";
  const region = item.region ?? "France";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-yuni-lg border border-slate-200/90 bg-white shadow-yuni-md">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <p className="min-w-0 text-xs leading-snug text-slate-500">{tags}</p>
        <button
          type="button"
          className="shrink-0 rounded-yuni-sm p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Enregistrer pour plus tard"
        >
          <Bookmark className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <h3 className="px-4 pt-3 font-display text-xl font-bold leading-snug tracking-tight text-yuni-slate-900 sm:text-[1.35rem]">
        {item.title}
      </h3>
      <p className="px-4 pt-2 font-body text-sm leading-snug text-yuni-slate-600 line-clamp-2">
        {item.meta}
      </p>

      <div className="px-4 pt-5">
        <div className="flex h-1.5 overflow-hidden rounded-yuni-full">
          <div
            className="bg-red-600"
            style={{ width: `${leftPct}%` }}
            aria-hidden
          />
          <div
            className="bg-blue-700"
            style={{ width: `${rightPct}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>
            {Math.round(leftPct)}% couverture centre
          </span>
          <span>{sources} sources</span>
        </div>
      </div>

      <div className="relative mt-5 min-h-[140px] flex-1 overflow-hidden rounded-sm">
        {item.imageUrl ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
            {/* eslint-disable-next-line @next/next/no-img-element -- URLs API / CDN externes */}
            <img
              src={item.imageUrl}
              alt=""
              className="relative z-[1] h-full min-h-[140px] w-full object-cover"
            />
          </>
        ) : (
          <div
            className={`flex min-h-[140px] w-full flex-col justify-end bg-gradient-to-br p-3 ${
              item.bgGradient ?? "from-yuni-slate-700 to-yuni-slate-900"
            }`}
            aria-hidden
          >
            <span className="font-body text-xs text-white/70">{region}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-12">
          <p className="text-xs font-bold text-white drop-shadow-md">
            {time}
            <span className="font-normal opacity-90">, {region}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function CompactCard({ item }: { item: NewsCardItem }) {
  const key = item.category.toLowerCase();
  const tint = categoryTint[key] ?? categoryTint.default;
  const ph = placeholderBg[key] ?? placeholderBg.default;
  const s = item.sentiment;
  const grad = item.bgGradient ?? "from-yuni-slate-700 to-yuni-slate-900";

  return (
    <article className="flex flex-col overflow-hidden rounded-yuni-md border border-yuni-wheat-200 bg-white shadow-yuni-sm">
      <div
        className={`relative aspect-video w-full ${item.imageUrl ? ph : `bg-gradient-to-br ${grad}`}`}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col justify-end p-3" aria-hidden>
            <span className="font-body text-xs text-white/70">
              {item.region ?? "France"}
            </span>
          </div>
        )}
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

export function NewsCard({ item }: { item: NewsCardItem }) {
  if (item.magazine) {
    return <MagazineCard item={item} />;
  }
  return <CompactCard item={item} />;
}
