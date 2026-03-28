import { expect, test } from "@playwright/test";

import { cityDashboardJwt } from "./helpers/jwt";

test.describe("Dashboard ville", () => {
  test("dashboard nécessite rôle city_dashboard (cookies)", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test("dashboard KPIs visibles avec JWT ville", async ({
    page,
    context,
  }) => {
    const token = cityDashboardJwt();
    await context.addCookies([
      {
        name: "yuni-auth",
        value: "1",
        url: "http://localhost:3000",
      },
      {
        name: "yuni-jwt",
        value: encodeURIComponent(token),
        url: "http://localhost:3000",
      },
    ]);

    await page.route("**/v1/dashboard/**/vitality", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          city: "reims",
          computed_at: new Date().toISOString(),
          zones: [
            {
              zone: "centre",
              score: 72,
              grade: "B",
              trend: "up",
              dimensions: { social: { score: 70, weight: 0.2 } },
            },
          ],
          city_average: 72,
          top_zone: "centre",
          bottom_zone: "orgeval",
        }),
      });
    });

    await page.goto("/dashboard/overview");
    await expect(page.getByText(/Vitalité|Vue globale/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("meter").first()).toBeVisible();
  });
});
