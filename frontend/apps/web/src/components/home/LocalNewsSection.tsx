import Link from "next/link";

import { NewsCard, type NewsCardItem } from "./NewsCard";

export interface LocalNewsSectionProps {
  cityLabel: string;
  items: NewsCardItem[];
  updatedLabel: string;
  /** Variante citoyen : fil d’actu filtré par intérêts */
  filtered?: boolean;
}

export function LocalNewsSection({
  cityLabel,
  items,
  updatedLabel,
  filtered = false,
}: LocalNewsSectionProps) {
  return (
    <section aria-labelledby="local-news-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2
          id="local-news-heading"
          className="font-display text-2xl font-bold text-yuni-slate-900"
        >
          Actualités locales
          <span className="ml-2 font-body text-sm font-normal text-yuni-slate-500">
            › {cityLabel}
          </span>
          {filtered ? (
            <span className="ml-2 block font-body text-xs font-normal text-yuni-slate-400 md:inline md:text-sm">
              · filtré selon tes intérêts
            </span>
          ) : null}
        </h2>
        <span className="text-xs text-yuni-slate-400">{updatedLabel}</span>
      </div>
      <hr className="mb-6 border-t-2 border-black" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      <Link
        href="/feed"
        className="mt-6 inline-block border border-black px-6 py-2 font-body text-sm font-medium text-yuni-slate-900 transition-colors hover:bg-black hover:text-white"
      >
        Voir toutes les actualités →
      </Link>
    </section>
  );
}
