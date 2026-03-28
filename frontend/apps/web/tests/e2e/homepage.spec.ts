import { expect, test } from "@playwright/test";

test.describe("Accueil", () => {
  test("page d'accueil charge correctement", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Yuni AI/);
    await expect(page.getByText("Yuni connaît ta ville.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Activer Hey Yuni/i }),
    ).toBeVisible();
  });

  test("VitalityGauge visible après connexion (meter)", async ({ page }) => {
    await page.route("**/*vitality*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            city: "reims",
            zone: "centre",
            score: 72,
            grade: "B",
            trend: "stable",
            dimensions: [],
            computed_at: new Date().toISOString(),
            valid_until: new Date().toISOString(),
          },
          meta: {
            request_id: "e2e",
            timestamp: new Date().toISOString(),
            source: "e2e",
          },
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("test@reims.fr");
    await page.getByLabel(/Mot de passe/i).fill("demo");
    await page.getByRole("button", { name: /Connexion/i }).click();
    await page.waitForURL(/\/profile/);
    // Navigation client (pas de reload) pour conserver le JWT en mémoire (AuthProvider).
    await page.getByRole("link", { name: /^Yuni$/ }).click();
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('[role="meter"]').first()).toBeVisible({
      timeout: 25_000,
    });
  });
});
