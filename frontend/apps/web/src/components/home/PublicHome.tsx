"use client";

import { FeaturedActorsSection } from "@/components/home/FeaturedActorsSection";
import { HeyYuniPanel } from "@/components/home/HeyYuniPanel";
import { JoinCTAWidget } from "@/components/home/JoinCTAWidget";
import { LocalNewsSection } from "@/components/home/LocalNewsSection";
import { SentimentWidget } from "@/components/home/SentimentWidget";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { VitalityIndexLive } from "@/components/home/VitalityIndexLive";
import { DEFAULT_CITY } from "@/lib/constants";
import { DEMO_NEWS_ITEMS } from "@/components/home/homeHelpers";

function cityLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function PublicHome() {
  const label = cityLabel(DEFAULT_CITY);

  return (
    <div className="bg-[var(--surface-page)]">
      <section className="container mx-auto max-w-7xl border-t-2 border-black px-4 pb-10 pt-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-widest text-yuni-terracotta-600">
              Smart City · {label} ·{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="font-display text-5xl font-bold leading-none tracking-tight text-yuni-slate-900 lg:text-7xl">
              Ta ville.
              <br />
              <em className="text-yuni-terracotta-500 not-italic">Vivante.</em>
            </h1>
            <p className="mt-4 max-w-lg font-body text-xl text-yuni-slate-600">
              Recommandations IA · Voix citoyenne · Quêtes urbaines · Vitalité de
              quartier · Communauté locale
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/login"
                className="inline-flex min-h-[44px] items-center justify-center rounded-yuni-sm bg-yuni-terracotta-500 px-8 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-yuni-terracotta-700"
              >
                Rejoindre Yuni
              </a>
              <a
                href="#decouvrir"
                className="inline-flex min-h-[44px] items-center justify-center border-2 border-black px-8 py-3 font-body text-sm font-semibold text-yuni-slate-900 transition-colors hover:bg-black hover:text-white"
              >
                Découvrir
              </a>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-5">
            <VitalityIndexLive citySlug={DEFAULT_CITY} />
          </div>
        </div>
      </section>

      <section
        id="decouvrir"
        className="container mx-auto max-w-7xl px-4 pb-16 pt-4"
      >
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <LocalNewsSection
              cityLabel={label}
              items={DEMO_NEWS_ITEMS}
              updatedLabel="Vitrine découverte"
            />
            <UpcomingEventsSection events={[]} />
            <FeaturedActorsSection actors={[]} />
          </div>
          <aside className="space-y-8 lg:col-span-4">
            <HeyYuniPanel city={DEFAULT_CITY} mode="public" />
            <SentimentWidget citySlug={DEFAULT_CITY} />
            <JoinCTAWidget />
          </aside>
        </div>
      </section>
    </div>
  );
}
