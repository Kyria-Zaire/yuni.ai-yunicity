"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "yuni-admin-token";

export default function AdminGatePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [boot, setBoot] = useState(true);

  useEffect(() => {
    const existing = localStorage.getItem(KEY);
    if (existing) {
      document.cookie = `${KEY}=${encodeURIComponent(existing)}; path=/; max-age=86400; SameSite=Strict`;
      router.replace("/admin/overview");
      return;
    }
    setBoot(false);
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(KEY, token);
    document.cookie = `${KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Strict`;
    router.push("/admin/overview");
  }

  if (boot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yuni-slate-950 p-6 text-yuni-slate-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-yuni-slate-950 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-yuni-lg border border-yuni-slate-800 bg-yuni-slate-900 p-8 shadow-yuni-lg"
      >
        <h1 className="font-editorial text-2xl text-white">Accès admin</h1>
        <p className="text-sm text-yuni-slate-400">
          Saisissez le jeton <code className="text-yuni-wheat-300">X-Admin-Token</code>{" "}
          (stocké aussi dans le stockage local admin).
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full rounded-yuni-md border border-yuni-slate-700 bg-yuni-slate-950 px-3 py-2 text-sm text-white placeholder:text-yuni-slate-600"
          placeholder="Token"
          autoComplete="off"
        />
        <button
          type="submit"
          className="w-full rounded-yuni-md bg-yuni-terracotta-500 py-2.5 text-sm font-semibold text-white hover:bg-yuni-terracotta-600"
        >
          Continuer
        </button>
      </form>
    </div>
  );
}
