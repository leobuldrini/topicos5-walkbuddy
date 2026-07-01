import { test } from "@playwright/test";
import { addAvailability, saveWalkerProfile, signUp, uniqueEmail } from "./helpers";

test("CT-USU-04 creates walker profile and availability", async ({ page }) => {
  await signUp(page, { name: "Walker Perfil", email: uniqueEmail("walker"), roles: ["walker"] });
  await saveWalkerProfile(page, "Centro", "25");
  await addAvailability(page);
});
