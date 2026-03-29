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

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Vue globale", Icon: BarChart3 },
  { href: "/dashboard/zones", label: "Zones", Icon: Map },
  { href: "/dashboard/engagement", label: "Engagement", Icon: Users },
  { href: "/dashboard/actors", label: "Acteurs", Icon: Building2 },
  { href: "/dashboard/export", label: "Export ODBL", Icon: Download },
  { href: "/dashboard/federation", label: "Fédération EU", Icon: Globe },
];

export function DashboardNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto p-3">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          href === "/dashboard/overview"
            ? pathname === "/dashboard/overview" || pathname === "/dashboard"
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
  );
}
