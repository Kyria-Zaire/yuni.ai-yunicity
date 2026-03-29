"use client";

import { useEffect, useState } from "react";

/**
 * Identifiant de session généré après le montage client.
 * Évite `ReferenceError: crypto is not defined` en SSR (Node sans `globalThis.crypto`)
 * et les erreurs de rendu 500 sur les pages qui importent des composants utilisant un UUID.
 */
export function useClientSessionId(): string {
  const [id, setId] = useState("");

  useEffect(() => {
    setId(
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `yuni-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
    );
  }, []);

  return id;
}
