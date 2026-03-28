import { Suspense } from "react";

import ZonesClient from "./ZonesClient";

export default function DashboardZonesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-yuni-slate-600">Chargement des zones…</div>
      }
    >
      <ZonesClient />
    </Suspense>
  );
}
