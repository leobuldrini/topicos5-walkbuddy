import { expect, test } from "@playwright/test";
import { addAvailability, createPet, createWalkRequest, saveWalkerProfile, signUp, uniqueEmail } from "./helpers";

test("CT-USU-05 creates request, CT-USU-08 chooses walker, CT-INT-09 completes into history", async ({ browser }) => {
  const walkerContext = await browser.newContext();
  const walkerPage = await walkerContext.newPage();
  await signUp(walkerPage, { name: "Walker Centro", email: uniqueEmail("walk-walker"), roles: ["walker"] });
  await saveWalkerProfile(walkerPage, "Centro", "20");
  await addAvailability(walkerPage);

  const tutorContext = await browser.newContext();
  const tutorPage = await tutorContext.newPage();
  await signUp(tutorPage, { name: "Tutor Passeio", email: uniqueEmail("walk-tutor"), roles: ["tutor"] });
  await createPet(tutorPage, "Rex Caminhada");
  await createWalkRequest(tutorPage, { petName: "Rex Caminhada" });
  await expect(tutorPage.getByText("Escolher passeador")).toBeVisible();
  await tutorPage.getByRole("button", { name: "Escolher" }).first().click();

  await walkerPage.goto("/walker/requests");
  await walkerPage.getByRole("button", { name: "Aceitar" }).first().click();
  await walkerPage.getByRole("button", { name: "Iniciar" }).first().click();
  await walkerPage.getByRole("button", { name: "Concluir" }).first().click();

  await tutorPage.goto("/walks");
  await expect(tutorPage.getByText("Concluído")).toBeVisible();

  await walkerContext.close();
  await tutorContext.close();
});
