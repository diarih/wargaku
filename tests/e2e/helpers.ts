import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be available to run Playwright smoke tests.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();
  await page.waitForURL("**/dashboard");
  await expect(
    page.getByText("Selamat datang di pusat pendataan warga."),
  ).toBeVisible();
}

export function makeUniqueDigits(seed = Date.now()) {
  const random = `${seed}${Math.floor(Math.random() * 10_000)}`;
  return random.slice(0, 16).padEnd(16, "7");
}
