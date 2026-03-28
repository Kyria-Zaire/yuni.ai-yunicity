"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useYuniAIClient } from "@yuni/api-client/react";
import { YuniCard } from "@yuni/ui";

import { useJwtClaims } from "@/hooks/useJwtClaims";
import { DEFAULT_CITY } from "@/lib/constants";

export default function DashboardExportPage() {
  const client = useYuniAIClient();
  const claims = useJwtClaims();
  const city = claims?.city ?? DEFAULT_CITY;
  const [period, setPeriod] = useState<30 | 90>(30);
  const [format, setFormat] = useState<"json" | "csv">("json");

  const mut = useMutation({
    mutationFn: async () => {
      const data = await client.getCivicExport(city, period);
      if (format === "json") {
        return {
          blob: new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
          name: `civic_${city}_${period}j.json`,
        };
      }
      const row = `export_id,city,license,generated_at\n${data.export_id},${data.city},${data.license},${data.generated_at}\n`;
      return {
        blob: new Blob([row], { type: "text/csv;charset=utf-8" }),
        name: `civic_${city}_${period}j.csv`,
      };
    },
  });

  const run = () => {
    mut.mutate(undefined, {
      onSuccess: ({ blob, name }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.rel = "noopener";
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Export ODbL
        </h1>
        <p className="text-sm text-yuni-slate-600">
          Données civiques agrégées — {city}
        </p>
      </header>

      <YuniCard header="Licence">
        <p className="text-sm leading-relaxed text-yuni-slate-700">
          Ces données sont publiées sous licence ODbL 1.0. Toute réutilisation
          requiert attribution et partage à l’identique.
        </p>
      </YuniCard>

      <YuniCard header="Paramètres d’export">
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-yuni-slate-800">
              Période
            </legend>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="period"
                  checked={period === 30}
                  onChange={() => setPeriod(30)}
                />
                30 jours
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="period"
                  checked={period === 90}
                  onChange={() => setPeriod(90)}
                />
                90 jours
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-yuni-slate-800">
              Format
            </legend>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="fmt"
                  checked={format === "json"}
                  onChange={() => setFormat("json")}
                />
                JSON
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="fmt"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                />
                CSV (résumé)
              </label>
            </div>
          </fieldset>
          <button
            type="button"
            onClick={() => run()}
            disabled={mut.isPending}
            className="rounded-yuni-md bg-yuni-terracotta-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-yuni-terracotta-600 disabled:opacity-50"
          >
            Générer l’export
          </button>
          {mut.isError ? (
            <p className="text-sm text-yuni-terracotta-700">
              Échec — vérifiez le JWT et l’API.
            </p>
          ) : null}
        </div>
      </YuniCard>
    </div>
  );
}
