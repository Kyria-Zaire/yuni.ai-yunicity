import type { ReportCategory } from "@yuni/api-client";

/** Heuristique légère pour la démo (STT ou texte libre). */
export function inferReportCategory(text: string): ReportCategory {
  const t = text.toLowerCase();
  if (
    /lampadaire|éclairage|eclairage|luminaire|lumière|lumiere/i.test(t)
  ) {
    return "eclairage";
  }
  if (/poubelle|déchet|dechet|propreté|proprete|voirie|nid\-de\-poule|route|trottoir/i.test(t)) {
    return /poubelle|déchet|dechet|propreté|proprete/i.test(t) ? "proprete" : "voirie";
  }
  if (/sécurité|securite|agression|danger/i.test(t)) {
    return "securite";
  }
  if (/parc|arbre|nature|vert|haie/i.test(t)) {
    return "nature";
  }
  if (/chantier|égout|egout|infra|infrastructure|canalisation/i.test(t)) {
    return "infra";
  }
  return "autre";
}
