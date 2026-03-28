import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-editorial text-2xl text-yuni-slate-900">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-yuni-slate-600">
        La page demandée n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white"
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}
