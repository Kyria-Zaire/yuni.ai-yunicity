"use client";

import {
  BarChart3,
  Building2,
  Download,
  Globe,
  Map,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useJwtClaims } from "@/hooks/useJwtClaims";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Vue globale", Icon: BarChart3 },
  { href: "/dashboard/zones", label: "Zones", Icon: Map },
  { href: "/dashboard/engagement", label: "Engagement", Icon: Users },
  { href: "/dashboard/actors", label: "Acteurs", Icon: Building2 },
  { href: "/dashboard/export", label: "Export ODBL", Icon: Download },
  { href: "/dashboard/federation", label: "Fédération EU", Icon: Globe },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const claims = useJwtClaims();
  const cityLabel = claims?.city
    ? claims.city.charAt(0).toUpperCase() + claims.city.slice(1)
    : "Ville";

  return (
    <div className="flex min-h-screen bg-yuni-wheat-50">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-yuni-slate-900 text-yuni-slate-100">
        <div className="border-b border-yuni-slate-800 p-4">
          <p className="font-editorial text-lg text-white">Yuni AI</p>
          <p className="text-sm text-yuni-slate-400">{cityLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/dashboard/overview"
                ? pathname === "/dashboard/overview" ||
                  pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-yuni-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-yuni-terracotta-500 text-white"
                    : "text-yuni-slate-300 hover:bg-yuni-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="ml-[240px] min-h-screen flex-1 overflow-y-auto p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}
