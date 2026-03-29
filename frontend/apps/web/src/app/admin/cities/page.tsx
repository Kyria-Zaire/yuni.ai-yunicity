"use client";

import type { RegistryCityConfig } from "@yuni/api-client";
import {
  useCities,
  useFlushCityCacheMutation,
  usePatchCityRolloutMutation,
  useRegisterCityMutation,
} from "@yuni/api-client/react";
import { useEffect, useRef, useState } from "react";

import { useAdminToken } from "@/hooks/useAdminToken";

function CityModal({
  open,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (c: RegistryCityConfig) => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<RegistryCityConfig>(() =>
    makeEmptyCity(),
  );

  useEffect(() => {
    if (open) {
      setDraft(makeEmptyCity());
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-yuni-lg border border-slate-600 bg-slate-900 p-6 text-white shadow-yuni-lg">
        <h2 className="font-editorial text-xl">Nouvelle ville</h2>
        <div className="mt-4 space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-slate-300">city_id</span>
            <input
              className="w-full rounded-yuni-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-100"
              value={draft.city_id}
              onChange={(e) =>
                setDraft((d) => ({ ...d, city_id: e.target.value }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-slate-300">display_name</span>
            <input
              className="w-full rounded-yuni-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-100"
              value={draft.display_name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, display_name: e.target.value }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-slate-300">zones (virgules)</span>
            <input
              className="w-full rounded-yuni-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-100"
              value={draft.zones.join(",")}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  zones: e.target.value.split(",").map((z) => z.trim()).filter(Boolean),
                }))
              }
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-yuni-md px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(draft)}
            className="rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

function makeEmptyCity(): RegistryCityConfig {
  const now = new Date().toISOString();
  return {
    city_id: "demo-ville",
    display_name: "Demo Ville",
    country: "FR",
    language: "fr",
    center_lat: 49.25,
    center_lng: 4.03,
    zones: ["centre"],
    radius_km: 10,
    yunicity_api_url: "",
    yunicity_service_token_key: "YUNICITY_SERVICE_TOKEN",
    mistral_context: "",
    features: {
      recommendations: true,
      chat: true,
      voice: true,
      vitality: true,
      quests: true,
      merchant: true,
      reports: true,
      dashboard: true,
    },
    rollout_percentage: 10,
    active: true,
    onboarding_steps: [],
    local_contacts: [],
    created_at: now,
    updated_at: now,
  };
}

export default function AdminCitiesPage() {
  const adminToken = useAdminToken();
  const { data, refetch } = useCities(true);
  const patchMut = usePatchCityRolloutMutation();
  const flushMut = useFlushCityCacheMutation();
  const regMut = useRegisterCityMutation();

  const [localRollout, setLocalRollout] = useState<Record<string, number>>({});
  const debouncers = useRef<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function scheduleRollout(cityId: string, value: number, displayName: string) {
    setLocalRollout((prev) => ({ ...prev, [cityId]: value }));
    const prevTimer = debouncers.current[cityId];
    if (prevTimer) {
      window.clearTimeout(prevTimer);
    }
    debouncers.current[cityId] = window.setTimeout(() => {
      if (!adminToken) {
        return;
      }
      patchMut.mutate(
        { adminToken, cityId, percentage: value },
        {
          onSuccess: () => {
            setToast(`Rollout ${displayName} mis à jour → ${value}%`);
            void refetch();
          },
        },
      );
    }, 1000);
  }

  const flush = (city: string) => {
    if (!adminToken || !window.confirm(`Vider le cache Redis pour ${city} ?`)) {
      return;
    }
    flushMut.mutate(
      { adminToken, city },
      {
        onSuccess: () => setToast(`Cache ${city} vidé`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "#2D3748" }}>
            Villes
          </h1>
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Registre et rollout
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Ajouter une ville
        </button>
      </header>

      {toast ? (
        <div
          className="rounded-yuni-md border border-yuni-forest-500/40 px-4 py-2 text-sm"
          style={{ background: "rgba(45, 106, 79, 0.12)", color: "#1B4332" }}
        >
          {toast}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-yuni-lg border border-slate-400/40 bg-white/40 shadow-[2px_2px_6px_#B8B4AF,-2px_-2px_6px_#FFFFFF]">
        <table className="w-full text-left text-sm" style={{ color: "#2D3748" }}>
          <thead className="border-b border-slate-400/50" style={{ background: "rgba(255,255,255,0.45)" }}>
            <tr>
              <th className="p-3 font-semibold">Ville</th>
              <th className="p-3 font-semibold">Pays</th>
              <th className="p-3 font-semibold">Zones</th>
              <th className="p-3 font-semibold">Rollout</th>
              <th className="p-3 font-semibold">Actif</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.cities.map((c) => (
              <tr
                key={c.city_id}
                className="border-b border-slate-400/25 hover:bg-white/30"
              >
                <td className="p-3 font-medium">{c.display_name}</td>
                <td className="p-3">{c.country}</td>
                <td className="p-3">{c.zones.length}</td>
                <td className="p-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={localRollout[c.city_id] ?? c.rollout_percentage}
                    onChange={(e) =>
                      scheduleRollout(
                        c.city_id,
                        Number(e.target.value),
                        c.display_name,
                      )
                    }
                    className="w-36"
                  />
                  <span className="ml-2 text-xs" style={{ color: "#4A5568" }}>
                    {localRollout[c.city_id] ?? c.rollout_percentage}%
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-yuni-sm px-2 py-0.5 text-xs font-medium ${
                      c.active
                        ? "bg-yuni-forest-500/15 text-yuni-forest-500"
                        : "bg-amber-500/15 text-amber-800"
                    }`}
                  >
                    {c.active ? "oui" : "non"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => flush(c.city_id)}
                    className="text-xs font-medium underline"
                    style={{ color: "#8B2F08" }}
                  >
                    Flush cache
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CityModal
        open={modal}
        onClose={() => setModal(false)}
        busy={regMut.isPending}
        onSave={(body) => {
          if (!adminToken) {
            return;
          }
          regMut.mutate(
            { adminToken, body },
            {
              onSuccess: () => {
                setModal(false);
                setToast("Ville enregistrée");
                void refetch();
              },
            },
          );
        }}
      />
    </div>
  );
}
