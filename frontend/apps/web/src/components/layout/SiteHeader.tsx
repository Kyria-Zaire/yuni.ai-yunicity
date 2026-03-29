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

const activeNav =
  "text-yuni-terracotta-500 underline decoration-2 decoration-yuni-terracotta-500 underline-offset-[6px]";
const inactiveNav =
  "text-yuni-slate-700 transition-colors hover:text-yuni-terracotta-500";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-yuni-wheat-300/60 bg-yuni-wheat-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-editorial text-[28px] font-semibold leading-none text-yuni-terracotta-500"
        >
          Yuni
        </Link>
        <nav className="flex flex-wrap gap-1 text-[15px] font-body" aria-label="Navigation principale">
          {links.map((l) => {
            const active = isActivePath(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-yuni-sm px-3 py-1.5 font-medium ${
                  active ? activeNav : inactiveNav
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              aria-current={
                isActivePath(pathname, "/dashboard") ? "page" : undefined
              }
              className={`rounded-yuni-sm px-3 py-1.5 font-medium ${
                isActivePath(pathname, "/dashboard")
                  ? activeNav
                  : inactiveNav
              }`}
            >
              Ville
            </Link>
          ) : null}
          <Link
            href="/merchant"
            aria-current={pathname.startsWith("/merchant") ? "page" : undefined}
            className={`rounded-yuni-sm px-3 py-1.5 font-medium ${
              pathname.startsWith("/merchant") ? activeNav : inactiveNav
            }`}
          >
            Pro
          </Link>
          <Link
            href="/admin"
            aria-current={
              isActivePath(pathname, "/admin") ? "page" : undefined
            }
            className={`rounded-yuni-sm px-3 py-1.5 font-medium ${
              isActivePath(pathname, "/admin")
                ? activeNav
                : "text-yuni-slate-500 transition-colors hover:text-yuni-terracotta-500"
            }`}
          >
            Admin
          </Link>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="ml-2 rounded-yuni-md bg-yuni-terracotta-500 px-3 py-1.5 text-sm font-semibold text-white shadow-yuni-sm transition-shadow hover:bg-yuni-terracotta-700 hover:shadow-yuni-md"
            >
              Connexion
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
