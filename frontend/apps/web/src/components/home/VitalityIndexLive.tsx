"use client";

import { useVitality } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

import { VitalityIndexWidget } from "@/components/home/VitalityIndexWidget";
import { DEFAULT_ZONE } from "@/lib/constants";

import { zonesFromVitality } from "./homeHelpers";

export function VitalityIndexLive({ citySlug }: { citySlug: string }) {
  const { token } = useAuth();
  const vitality = useVitality(citySlug, DEFAULT_ZONE, Boolean(token));
  const vit = vitality.data?.data;
  const score = vit ? Math.round(vit.score) : 78;
  const zones = zonesFromVitality(vit);

  return <VitalityIndexWidget score={score} zones={zones} />;
}
