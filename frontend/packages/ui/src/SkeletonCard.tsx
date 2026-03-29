import type { ReactNode } from "react";

function getErrorStatus(error: Error | null): number | undefined {
  if (!error) return undefined;
  const withStatus = error as Error & { status?: number };
  if (typeof withStatus.status === "number") return withStatus.status;
  const msg = error.message ?? "";
  const m = msg.match(/\b(401|403|404|500)\b/);
  return m ? Number(m[1]) : undefined;
}

export interface SkeletonCardProps {
  isLoading: boolean;
  error: Error | null;
  empty: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  children: ReactNode;
}

export function SkeletonCard({
  isLoading,
  error,
  empty,
  errorMessage = "Impossible de charger",
  emptyMessage = "Rien à afficher pour le moment",
  children,
}: SkeletonCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse motion-reduce:animate-none space-y-3 rounded-lg border border-yuni-wheat-300/60 bg-white p-4">
        <div className="h-4 w-3/4 rounded bg-yuni-wheat-100" />
        <div className="h-4 w-1/2 rounded bg-yuni-wheat-100" />
        <div className="h-20 rounded bg-yuni-wheat-100" />
      </div>
    );
  }

  if (error) {
    const status = getErrorStatus(error);
    const is401 = status === 401;
    return (
      <div
        role="alert"
        className="space-y-2 rounded-lg border border-yuni-terracotta-100 bg-white p-6 text-center"
      >
        <p className="text-2xl" aria-hidden>
          😔
        </p>
        <p className="font-editorial text-lg text-yuni-slate-700">
          {is401 ? "Connecte-toi pour voir ce contenu" : errorMessage}
        </p>
        {!is401 ? (
          <p className="text-sm text-yuni-slate-500">
            Vérifie ta connexion et réessaie
          </p>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="space-y-3 rounded-lg border border-yuni-wheat-300/60 bg-white p-8 text-center">
        <p className="text-3xl" aria-hidden>
          🌱
        </p>
        <p className="font-editorial text-xl text-yuni-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
