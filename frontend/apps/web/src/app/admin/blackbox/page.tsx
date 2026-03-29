"use client";

import { useEffect, useState } from "react";

import {
  useAuditChain,
  useAuditRecords,
  useVerifyAuditMutation,
} from "@yuni/api-client/react";

import { NeuroButton, NeuroCard } from "@/components/neuro";
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
              ? "Intégrité vérifiée"
              : "Anomalie détectée",
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
          <h1 className="font-display text-3xl font-bold" style={{ color: "#2D3748" }}>
            Blackbox civique
          </h1>
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Chaîne d&apos;audit — {city}
          </p>
        </div>
        <NeuroButton
          onClick={() => verify()}
          disabled={verifyMut.isPending}
          loading={verifyMut.isPending}
        >
          Vérifier l&apos;intégrité
        </NeuroButton>
      </header>

      {toast ? (
        <div
          className="rounded-yuni-md border border-slate-300 bg-white/90 px-4 py-2 font-body text-sm shadow-yuni-sm"
          style={{ color: "#2D3748" }}
        >
          {toast}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <NeuroCard variant="raised">
          <p className="font-body text-xs uppercase tracking-wide" style={{ color: "#4A5568" }}>
            Enregistrements
          </p>
          <p
            className="mt-1 font-mono text-2xl font-bold"
            style={{
              color: "#2D3748",
              fontFamily: "var(--font-neuro-mono), ui-monospace, monospace",
            }}
          >
            {c?.records_count ?? "—"}
          </p>
        </NeuroCard>
        <NeuroCard variant="raised">
          <p className="font-body text-xs uppercase tracking-wide" style={{ color: "#4A5568" }}>
            Intégrité
          </p>
          <p
            className="mt-1 font-body text-lg font-semibold"
            style={{
              color: c == null ? "#4A5568" : c.chain_valid ? "#2D6A4F" : "#C1440E",
            }}
          >
            {c == null ? "—" : c.chain_valid ? "Valide" : "Altération détectée"}
          </p>
        </NeuroCard>
        <NeuroCard variant="raised">
          <p className="font-body text-xs uppercase tracking-wide" style={{ color: "#4A5568" }}>
            Dernier enregistrement
          </p>
          <p className="mt-1 font-body text-sm" style={{ color: "#2D3748" }}>
            {c?.newest_record
              ? new Date(c.newest_record).toLocaleString("fr-FR")
              : "—"}
          </p>
        </NeuroCard>
      </section>

      <NeuroCard variant="inset" className="overflow-x-auto p-0">
        <table className="w-full text-left font-body text-sm" style={{ color: "#2D3748" }}>
          <thead className="border-b border-slate-400/50" style={{ background: "rgba(255,255,255,0.35)" }}>
            <tr>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Modèle</th>
              <th className="p-3 font-semibold">Source</th>
              <th className="p-3 font-semibold">Latence</th>
              <th className="p-3 font-semibold">Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {records.data?.map((r) => (
              <tr
                key={r.record_id}
                className="border-b border-slate-400/30"
              >
                <td className="p-3 font-mono text-xs">{r.decision_type}</td>
                <td className="p-3">{r.model_used}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">{r.latency_ms} ms</td>
                <td className="p-3 text-xs" style={{ color: "#4A5568" }}>
                  {new Date(r.timestamp).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeuroCard>
    </div>
  );
}
