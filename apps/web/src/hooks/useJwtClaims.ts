"use client";

import { useAuth } from "@yuni/auth";
import { useMemo } from "react";

export interface JwtClaims {
  role?: string;
  city?: string;
  sub?: string;
}

export function useJwtClaims(): JwtClaims | null {
  const { token } = useAuth();
  return useMemo(() => {
    if (!token) {
      return null;
    }
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }
      const json = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      ) as JwtClaims;
      return json;
    } catch {
      return null;
    }
  }, [token]);
}
