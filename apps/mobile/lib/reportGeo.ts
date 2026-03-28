import type { GeoInput } from "@yuni/api-client";

/** Tronque les coordonnées à 2 décimales (RGPD / spec backend). */
export function truncateToTwoDecimals(lat: number, lng: number): GeoInput {
  return {
    lat_truncated: Math.round(lat * 100) / 100,
    lng_truncated: Math.round(lng * 100) / 100,
  };
}
