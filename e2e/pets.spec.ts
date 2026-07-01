import { expect, test } from "@playwright/test";
import { createPet, signUp, uniqueEmail } from "./helpers";

test("CT-USU-03 creates pet, CT-NF-04 validates required fields, CT-NF-06 persists after reload", async ({ page }) => {
  await signUp(page, { name: "Tutor Pets", email: uniqueEmail("pets"), roles: ["tutor"] });

  await page.goto("/pets/new");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Informe o nome do pet")).toBeVisible();

  await createPet(page, "Rex Persistente");
  await page.reload();
  await expect(page.getByText("Rex Persistente")).toBeVisible();
});
