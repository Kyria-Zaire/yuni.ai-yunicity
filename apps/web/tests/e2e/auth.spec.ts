import { expect, test } from "@playwright/test";

test.describe("Auth", () => {
  test("redirect vers login si non connecté", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/profile");
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test("login avec JWT mock → accès profile", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("test@reims.fr");
    await page.getByLabel(/Mot de passe/i).fill("demo");
    await page.getByRole("button", { name: /Connexion/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
  });
});
