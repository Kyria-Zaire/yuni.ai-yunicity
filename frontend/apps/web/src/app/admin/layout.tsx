"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import "@/app/dashboard/neuro-tokens.css";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/overview", label: "Vue d'ensemble" },
  { href: "/admin/cities", label: "Villes" },
  { href: "/admin/budget", label: "Budget" },
  { href: "/admin/blackbox", label: "Blackbox" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#E8E4DF" }}>
      <header className="flex flex-wrap items-center gap-6 border-b border-slate-800 bg-yuni-slate-900 px-6 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
        <span className="font-editorial text-xl text-white">Admin Yuni AI</span>
        <nav className="flex flex-wrap gap-4 text-sm">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "font-medium text-orange-400"
                  : "text-slate-300 hover:text-white"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="p-6" style={{ color: "#2D3748" }}>
        {children}
      </div>
    </div>
  );
}
