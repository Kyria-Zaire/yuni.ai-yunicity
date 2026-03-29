"use client";

import { useAuth } from "@yuni/auth";

import { useJwtClaims } from "@/hooks/useJwtClaims";

export type HomepageRole =
  | "public"
  | "citizen"
  | "merchant"
  | "city_dashboard";

/**
 * Rôle d’affichage de la home (Smart City) — dérivé du JWT, pas du profil AuthUser seul.
 */
export function useHomepageState(): HomepageRole {
  const { token } = useAuth();
  const claims = useJwtClaims();
  if (!token) {
    return "public";
  }
  const role = claims?.role;
  if (role === "city_dashboard") {
    return "city_dashboard";
  }
  if (role === "merchant") {
    return "merchant";
  }
  return "citizen";
}
