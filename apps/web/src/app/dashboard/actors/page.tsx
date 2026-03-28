"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useDashboardActors, useExportDashboardMutation } from "@yuni/api-client/react";
import { YuniCard } from "@yuni/ui";

import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";

type SortKey = "name" | "category" | "recommendation_count" | "semantic" | "zone";

function semanticFromId(id: string, recs: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  }
  return Math.min(1, h / 1000 + Math.min(recs / 400, 0.45));
}

function zoneLabel(id: string): string {
  const zones = [
    "centre",
    "clairmarais",
    "croix-rouge",
    "wilson",
    "laon-zola",
    "europe",
    "orgeval",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i)) % zones.length;
  }
  return zones[h] ?? "centre";
}

const CATEGORY_OPTIONS = [
  "all",
  "culture",
  "gastronomie",
  "sport",
  "commerce",
  "autre",
];

export default function DashboardActorsPage() {
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const { data, isLoading } = useDashboardActors(city, true);
  const exportMut = useExportDashboardMutation();

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "recommendation_count",
    dir: "desc",
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const rows = useMemo(() => {
    const actors = data?.actors ?? [];
    return actors.map((a) => ({
      ...a,
      semantic: semanticFromId(a.id, a.recommendation_count),
      zone: zoneLabel(a.id),
    }));
  }, [data?.actors]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      const matchQ =
        debounced.trim() === "" ||
        r.name.toLowerCase().includes(debounced.toLowerCase());
      const matchC =
        category === "all" ||
        r.category.toLowerCase().includes(category.toLowerCase());
      return matchQ && matchC;
    });
    out = [...out].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "semantic") {
        return (a.semantic - b.semantic) * dir;
      }
      if (sort.key === "recommendation_count") {
        return (a.recommendation_count - b.recommendation_count) * dir;
      }
      if (sort.key === "name") {
        return a.name.localeCompare(b.name, "fr") * dir;
      }
      if (sort.key === "category") {
        return a.category.localeCompare(b.category, "fr") * dir;
      }
      return a.zone.localeCompare(b.zone, "fr") * dir;
    });
    return out;
  }, [rows, debounced, category, sort]);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }, []);

  const exportCsv = async () => {
    const result = await exportMut.mutateAsync({ city, format: "csv" });
    if (result instanceof Blob) {
      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${city}_vitality.csv`;
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-yuni-slate-900">
            Acteurs
          </h1>
          <p className="text-sm text-yuni-slate-600">{city}</p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exportMut.isPending}
          className="rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-yuni-terracotta-600 disabled:opacity-50"
        >
          Exporter CSV
        </button>
      </header>

      <YuniCard header="Filtres">
        <div className="flex flex-wrap gap-4">
          <input
            type="search"
            placeholder="Recherche par nom…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[200px] rounded-yuni-md border border-yuni-wheat-200 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-yuni-md border border-yuni-wheat-200 px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Toutes catégories" : c}
              </option>
            ))}
          </select>
        </div>
      </YuniCard>

      <YuniCard header="Tableau">
        {isLoading ? (
          <p className="text-sm text-yuni-slate-600">Chargement…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-yuni-wheat-200">
                  {(
                    [
                      ["name", "Nom"],
                      ["category", "Catégorie"],
                      ["recommendation_count", "Reco."],
                      ["semantic", "Score sémantique"],
                      ["zone", "Zone"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="py-2 pr-3">
                      <button
                        type="button"
                        className="font-semibold text-yuni-slate-800 hover:underline"
                        onClick={() => toggleSort(key)}
                      >
                        {label}
                        {sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-yuni-wheat-50 hover:bg-yuni-wheat-50/80"
                  >
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="pr-3">
                      <span className="rounded-yuni-sm bg-yuni-wheat-100 px-2 py-0.5 text-xs capitalize text-yuni-slate-800">
                        {r.category}
                      </span>
                    </td>
                    <td
                      className={`pr-3 ${
                        r.recommendation_count > 100 ? "font-bold" : ""
                      }`}
                    >
                      {r.recommendation_count}
                    </td>
                    <td className="pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-yuni-full bg-yuni-wheat-100">
                          <div
                            className="h-full bg-yuni-terracotta-500"
                            style={{ width: `${r.semantic * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-yuni-slate-600">
                          {r.semantic.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="capitalize text-yuni-slate-700">{r.zone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </YuniCard>
    </div>
  );
}
