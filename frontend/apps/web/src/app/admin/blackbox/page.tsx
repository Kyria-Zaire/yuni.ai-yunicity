"use client";

import { useEffect, useState } from "react";

import {
  useAuditChain,
  useAuditRecords,
  useVerifyAuditMutation,
} from "@yuni/api-client/react";

import { useAdminToken } from "@/hooks/useAdminToken";
import { DEFAULT_CITY } from "@/lib/constants";

export default function AdminBlackboxPage() {
  const city = DEFAULT_CITY;
  const adminToken = useAdminToken();
  const chain = useAuditChain(city, true);
  const records = useAuditRecords(city, 20, true);
  const verifyMut = useVerifyAuditMutation();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const verify = () => {
    if (!adminToken) {
      setToast("Token admin manquant");
      return;
    }
    verifyMut.mutate(
      { adminToken, city },
      {
        onSuccess: (r) => {
          setToast(
            r.chain_valid
              ? "Intégrité vérifiée ✅"
              : "⚠️ Anomalie détectée",
          );
        },
        onError: () => setToast("Échec de la vérification"),
      },
    );
  };

  const c = chain.data;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-white">Blackbox civique</h1>
          <p className="text-sm text-slate-300">
            Chaîne d’audit — {city}
          </p>
        </div>
        <button
          type="button"
          onClick={() => verify()}
          disabled={verifyMut.isPending}
          className="rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Vérifier l’intégrité
        </button>
      </header>

      {toast ? (
        <div className="rounded-yuni-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
          {toast}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-yuni-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Enregistrements</p>
          <p className="text-2xl font-bold text-white">
            {c?.records_count ?? "—"}
          </p>
        </div>
        <div className="rounded-yuni-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Intégrité</p>
          <p className="text-lg text-emerald-400">
            {c ? (c.chain_valid ? "✅ Valide" : "❌ Altération détectée") : "—"}
          </p>
        </div>
        <div className="rounded-yuni-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Dernier enregistrement</p>
          <p className="text-sm text-slate-200">
            {c?.newest_record
              ? new Date(c.newest_record).toLocaleString("fr-FR")
              : "—"}
          </p>
        </div>
      </section>

      <div className="overflow-x-auto rounded-yuni-lg border border-slate-800">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Modèle</th>
              <th className="p-3">Source</th>
              <th className="p-3">Latence</th>
              <th className="p-3">Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {records.data?.map((r) => (
              <tr
                key={r.record_id}
                className="border-b border-slate-800/80 bg-slate-950/50 hover:bg-slate-900/80"
              >
                <td className="p-3 font-mono text-xs text-slate-200">{r.decision_type}</td>
                <td className="p-3 text-slate-200">{r.model_used}</td>
                <td className="p-3 text-slate-200">{r.source}</td>
                <td className="p-3 text-slate-200">{r.latency_ms} ms</td>
                <td className="p-3 text-xs text-slate-400">
                  {new Date(r.timestamp).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
