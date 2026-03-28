/** JWT factice lisible par le middleware (payload JSON base64url). */
export function cityDashboardJwt(): string {
  const payload = btoa(
    JSON.stringify({
      role: "city_dashboard",
      city: "reims",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.mock`;
}
