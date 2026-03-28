import { expect, test } from "@playwright/test";

test.describe("Commerçant", () => {
  test("formulaire merchant et réponse mockée", async ({ page }) => {
    await page.route("**/v1/merchant/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          business_name: "Boulangerie du Centre",
          contents: [
            {
              content_type: "post_social",
              text: "Croissants du jour — beurre local.",
              char_count: 32,
              suggestions: [],
              hashtags: ["reims", "boulangerie"],
              best_post_time: "Mardi 18h-20h",
              generated_at: new Date().toISOString(),
            },
          ],
          total_generated: 1,
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("test@reims.fr");
    await page.getByLabel(/Mot de passe/i).fill("demo");
    await page.getByRole("button", { name: /Connexion/i }).click();
    await page.waitForURL(/\/profile/);

    await page.goto("/merchant");
    await page.locator('input[name="businessName"]').fill("Boulangerie du Centre");
    await page.locator('input[name="businessType"]').fill("Boulangerie artisanale");
    await page.locator('select[name="contentType"]').selectOption("post_social");
    await page.locator('textarea[name="topic"]').fill(
      "Nos croissants sont faits avec du beurre local et de la farine T65.",
    );
    await page.getByRole("button", { name: /Générer avec Yuni AI/i }).click();
    await expect(page.getByText(/Généré par Yuni AI/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
