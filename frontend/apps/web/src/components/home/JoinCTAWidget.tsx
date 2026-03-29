import Link from "next/link";

export function JoinCTAWidget() {
  return (
    <div className="border-2 border-black bg-yuni-wheat-50 p-6 text-center">
      <p className="font-display text-lg font-bold text-yuni-slate-900">
        Rejoins la communauté
      </p>
      <p className="mt-2 text-sm text-yuni-slate-600">
        Quêtes, XP, recommandations et voix citoyenne.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-block min-h-[44px] w-full rounded-yuni-md bg-yuni-terracotta-500 px-4 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-yuni-terracotta-700"
      >
        Rejoindre Yuni
      </Link>
    </div>
  );
}
