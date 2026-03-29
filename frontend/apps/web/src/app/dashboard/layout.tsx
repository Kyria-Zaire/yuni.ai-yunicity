"use client";

import Link from "next/link";

import { useJwtClaims } from "@/hooks/useJwtClaims";

import { DashboardNav } from "./DashboardNav";
import "./neuro-tokens.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = useJwtClaims();
  const cityLabel = claims?.city
    ? claims.city.charAt(0).toUpperCase() + claims.city.slice(1)
    : "Ville";

  return (
    <div className="flex min-h-screen" style={{ background: "#E8E4DF" }}>
      <aside
        className="fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-60 flex-col bg-yuni-slate-900 text-white shadow-[4px_0_24px_rgba(0,0,0,0.15)]"
        style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        <div className="border-b border-yuni-slate-800 p-4">
          <Link href="/dashboard/overview" className="block">
            <p className="font-editorial text-lg text-white">Yuni AI</p>
          </Link>
          <p className="text-sm text-yuni-slate-400">{cityLabel}</p>
        </div>
        <DashboardNav />
      </aside>

      <main
        className="ml-60 flex-1 p-6 md:p-10"
        style={{ background: "#E8E4DF" }}
      >
        {children}
      </main>
    </div>
  );
}
