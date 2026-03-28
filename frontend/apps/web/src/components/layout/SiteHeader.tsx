"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@yuni/auth";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/map", label: "Carte" },
  { href: "/feed", label: "Feed" },
  { href: "/quests", label: "Quêtes" },
  { href: "/profile", label: "Profil" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-yuni-wheat-100 bg-yuni-wheat-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-editorial text-xl text-yuni-terracotta-700"
        >
          Yuni
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-yuni-md px-3 py-1.5 transition ${
                  active
                    ? "bg-yuni-terracotta-100 text-yuni-terracotta-900"
                    : "text-yuni-slate-600 hover:bg-yuni-wheat-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-yuni-md px-3 py-1.5 text-yuni-slate-600 hover:bg-yuni-wheat-100"
            >
              Ville
            </Link>
          ) : null}
          <Link
            href="/merchant"
            className="rounded-yuni-md px-3 py-1.5 text-yuni-slate-600 hover:bg-yuni-wheat-100"
          >
            Pro
          </Link>
          <Link
            href="/admin"
            className="rounded-yuni-md px-3 py-1.5 text-yuni-slate-500 hover:bg-yuni-wheat-100"
          >
            Admin
          </Link>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="ml-2 rounded-yuni-md bg-yuni-terracotta-500 px-3 py-1.5 text-white"
            >
              Connexion
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
