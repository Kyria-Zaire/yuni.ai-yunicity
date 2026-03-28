"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-editorial text-2xl text-yuni-slate-900">
        Une erreur est survenue
      </h1>
      <p className="mt-2 text-sm text-yuni-terracotta-800">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-yuni-md bg-yuni-terracotta-500 px-4 py-2 text-sm font-medium text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
