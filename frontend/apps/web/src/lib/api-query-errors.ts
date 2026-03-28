import { YuniAPIError } from "@yuni/api-client";

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof YuniAPIError && error.status === 401;
}

export function apiLoadErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Connecte-toi pour voir le contenu.";
  }
  return "Impossible de charger les données.";
}
