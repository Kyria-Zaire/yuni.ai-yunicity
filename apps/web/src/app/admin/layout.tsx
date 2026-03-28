"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="min-h-screen bg-yuni-slate-950 text-yuni-slate-100">
      <header className="flex flex-wrap items-center gap-6 border-b border-yuni-slate-800 px-6 py-4">
        <span className="font-editorial text-xl text-white">Admin Yuni AI</span>
        <nav className="flex flex-wrap gap-4 text-sm">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "font-medium text-yuni-terracotta-400"
                  : "text-yuni-slate-400 hover:text-white"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
