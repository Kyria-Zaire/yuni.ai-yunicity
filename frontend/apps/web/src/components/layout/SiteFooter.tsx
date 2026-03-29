import Link from "next/link";

const LEGAL_LINKS = [
  { href: "#", label: "Mentions légales" },
  { href: "#", label: "Confidentialité" },
  { href: "#", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xl font-bold text-black">Yuni.ai</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
              Ta ville, en direct.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--text-secondary)]"
            aria-label="Liens pied de page"
          >
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="underline-offset-4 hover:text-black hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Yuni.ai · Média territorial souverain · Reims
        </p>
      </div>
    </footer>
  );
}
