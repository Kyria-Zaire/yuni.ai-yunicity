"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { useVitality } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

import { DEFAULT_CITY, DEFAULT_ZONE } from "@/lib/constants";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/map", label: "Carte" },
  { href: "/feed", label: "Feed" },
  { href: "/quests", label: "Quêtes" },
  { href: "/profile", label: "Profil" },
  { href: "/merchant", label: "Pro" },
] as const;

const activeNav =
  "text-yuni-terracotta-600 underline decoration-2 decoration-yuni-terracotta-500 underline-offset-[6px]";
const inactiveNav =
  "text-yuni-slate-800 transition-colors hover:text-yuni-terracotta-600";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  return pathname === href;
}

function cityDisplay(slug: string): string {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const { isAuthenticated } = useAuth();
  const vitality = useVitality(DEFAULT_CITY, DEFAULT_ZONE, isAuthenticated);
  const score = vitality.data?.data?.score;
  const cityLabel = cityDisplay(DEFAULT_CITY);
  const [now, setNow] = useState<Date | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const timeStr =
    now &&
    now.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const vitalityLabel =
    isAuthenticated && typeof score === "number" ? (
      <span className="text-green-600">
        ● {Math.round(score)}{" "}
        {score >= 60 ? "Positif" : score >= 40 ? "Neutre" : "À surveiller"}
      </span>
    ) : (
      <span className="text-yuni-slate-500">● —</span>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-black bg-[var(--surface-header)]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-yuni-md border border-yuni-slate-200 text-yuni-slate-800 md:hidden"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="sr-only">
                {mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              </span>
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
            <div>
              <Link
                href="/"
                className="font-display text-2xl font-bold leading-none tracking-tight text-black"
              >
                YUNI.AI
              </Link>
              <p className="mt-0.5 font-body text-[11px] text-yuni-slate-500">
                {cityLabel} · Média territorial
              </p>
            </div>
          </div>

          <nav
            className="hidden flex-wrap items-center gap-1 font-body text-sm font-medium md:flex"
            aria-label="Navigation principale"
          >
            {links.map((l) => {
              const active = isActivePath(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-yuni-sm px-3 py-2 ${
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
                className={`rounded-yuni-sm px-3 py-2 ${
                  isActivePath(pathname, "/dashboard")
                    ? activeNav
                    : inactiveNav
                }`}
              >
                Ville
              </Link>
            ) : null}
            <Link
              href="/admin"
              aria-current={
                isActivePath(pathname, "/admin") ? "page" : undefined
              }
              className={`rounded-yuni-sm px-3 py-2 ${
                isActivePath(pathname, "/admin")
                  ? activeNav
                  : "text-yuni-slate-500 transition-colors hover:text-yuni-terracotta-600"
              }`}
            >
              Admin
            </Link>
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="ml-1 rounded-yuni-md bg-yuni-terracotta-500 px-3 py-2 text-sm font-semibold text-white shadow-yuni-sm transition-colors hover:bg-yuni-terracotta-700"
              >
                Connexion
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-yuni-wheat-200 pt-2 font-body text-sm font-medium text-yuni-slate-700">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            Index vitalité : {vitalityLabel}
            <span aria-hidden>·</span>
            <span>{cityLabel}</span>
            {timeStr ? (
              <>
                <span aria-hidden>·</span>
                <time dateTime={now?.toISOString()}>{timeStr}</time>
              </>
            ) : null}
          </span>
        </div>

        <div
          id={menuId}
          className={`${mobileOpen ? "block" : "hidden"} border-t border-yuni-wheat-200 py-3 md:hidden`}
        >
          <nav className="flex flex-col gap-1 font-body text-sm font-medium" aria-label="Navigation mobile">
            {links.map((l) => {
              const active = isActivePath(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-yuni-sm px-3 py-3 ${
                    active ? activeNav : inactiveNav
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={`rounded-yuni-sm px-3 py-3 ${
                  isActivePath(pathname, "/dashboard")
                    ? activeNav
                    : inactiveNav
                }`}
                onClick={() => setMobileOpen(false)}
              >
                Ville
              </Link>
            ) : null}
            <Link
              href="/admin"
              className={`rounded-yuni-sm px-3 py-3 ${
                isActivePath(pathname, "/admin") ? activeNav : inactiveNav
              }`}
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="mt-2 rounded-yuni-md bg-yuni-terracotta-500 px-3 py-3 text-center font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Connexion
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
      <hr className="m-0 w-full border-0 border-t-2 border-black" />
    </header>
  );
}
