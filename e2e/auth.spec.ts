import { expect, test } from "@playwright/test";
import { signIn, signUp, uniqueEmail } from "./helpers";

test("CT-NF-03 protected route blocks anonymous", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("CT-USU-01 signup and CT-USU-02 login", async ({ page }) => {
  const email = uniqueEmail("auth");
  await signUp(page, { name: "Tutor Auth", email, roles: ["tutor"] });
  await page.getByRole("button", { name: "Sair" }).click();
  await signIn(page, email);
});
