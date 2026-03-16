import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./helpers";

test("admin can sign in from the login page", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(
    page.getByRole("heading", { name: /pusat pendataan warga/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Keluar" })).toBeVisible();
});
