/** Identifiant fédération aligné sur les seeds backend (`reims-fr`, …). */
export function federationCityId(city: string): string {
  if (city.toLowerCase() === "reims") {
    return "reims-fr";
  }
  return `${city.toLowerCase()}-fr`;
}
