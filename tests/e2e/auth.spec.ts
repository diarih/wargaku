import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./helpers";

test("admin can sign in from the login page", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(
    page.getByRole("heading", { name: /pusat pendataan warga/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Keluar" })).toBeVisible();
});

test("invalid credentials show an error toast", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("invalid-user");
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();

  await expect(
    page.getByText("Username atau password tidak valid."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
