import { HeyYuniWeb } from "@/components/voice/HeyYuniWeb";

import { MetricCard, type MetricCardProps } from "./MetricCard";

export interface HeroSectionProps {
  /** Slug ville (API), ex. reims */
  city: string;
  cityLabel: string;
  metrics: MetricCardProps[];
}

export function HeroSection({ city, cityLabel, metrics }: HeroSectionProps) {
  return (
    <section
      className="border-t-2 border-black pb-8 pt-6"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-yuni-terracotta-600">
              Média territorial · {cityLabel}
            </p>
            <h1
              id="hero-heading"
              className="font-display text-5xl font-bold leading-none tracking-tight text-yuni-slate-900 lg:text-7xl"
            >
              Ta ville,
              <br />
              <em className="text-yuni-terracotta-500 not-italic">en direct.</em>
            </h1>
            <p className="mt-4 max-w-md font-body text-lg text-yuni-slate-600">
              Recommandations · Vitalité · Voix · Quêtes
            </p>
            <div className="mt-8">
              <HeyYuniWeb city={city} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
