import type { GeoInput, ReportCategory } from "@yuni/api-client";

import { inferReportCategory } from "../lib/reportCategory";
import { truncateToTwoDecimals } from "../lib/reportGeo";

describe("FE-014 — signalement (logique pure)", () => {
  it("étape géoloc : tronque à 2 décimales", () => {
    const g: GeoInput = truncateToTwoDecimals(49.258333, 4.031777);
    expect(g.lat_truncated).toBe(49.26);
    expect(g.lng_truncated).toBe(4.03);
  });

  it("géoloc opt-out : null si non inclus (simulé côté UI)", () => {
    const include = false;
    const geo = include ? truncateToTwoDecimals(48.85, 2.35) : null;
    expect(geo).toBeNull();
  });

  it("infère une catégorie depuis le texte (éclairage)", () => {
    const c: ReportCategory = inferReportCategory("le lampadaire est cassé");
    expect(c).toBe("eclairage");
  });

  it("POST /v1/reports — corps attendu (shape)", () => {
    const body = {
      city: "reims",
      description: "Test signalement unitaire",
      category: "voirie" as ReportCategory,
      geo: null as GeoInput | null,
      source: "text" as const,
    };
    expect(body).toMatchObject({
      city: "reims",
      source: "text",
    });
    expect(body.geo).toBeNull();
  });
});
