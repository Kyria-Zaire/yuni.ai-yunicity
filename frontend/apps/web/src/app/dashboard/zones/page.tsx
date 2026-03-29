import { Suspense } from "react";

import ZonesClient from "./ZonesClient";

export default function DashboardZonesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 font-body text-sm" style={{ color: "#4A5568" }}>
          Chargement des zones…
        </div>
      }
    >
      <ZonesClient />
    </Suspense>
  );
}
