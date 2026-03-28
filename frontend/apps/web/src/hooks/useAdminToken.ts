"use client";

import { useEffect, useState } from "react";

const KEY = "yuni-admin-token";

export function useAdminToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const v = localStorage.getItem(KEY);
      setToken(v);
      if (v) {
        document.cookie = `${KEY}=${encodeURIComponent(v)}; path=/; max-age=86400; SameSite=Strict`;
      }
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return token;
}
