import { expect, test } from "@playwright/test";
import { addAvailability, createPet, createWalkRequest, saveWalkerProfile, signUp, uniqueEmail } from "./helpers";

test("CT-INT-03/04/05 shows ranked recommendation with justification", async ({ browser }) => {
  const walkerContext = await browser.newContext();
  const walkerPage = await walkerContext.newPage();
  await signUp(walkerPage, { name: "Walker Recomendado", email: uniqueEmail("rec-walker"), roles: ["walker"] });
  await saveWalkerProfile(walkerPage, "Centro", "20");
  await addAvailability(walkerPage);

  const tutorContext = await browser.newContext();
  const tutorPage = await tutorContext.newPage();
  await signUp(tutorPage, { name: "Tutor Recomendador", email: uniqueEmail("rec-tutor"), roles: ["tutor"] });
  await createPet(tutorPage, "Rex IA");
  await createWalkRequest(tutorPage, { petName: "Rex IA" });

  await expect(tutorPage.getByText("Escolher passeador")).toBeVisible();
  await expect(tutorPage.getByText("Atende sua região")).toBeVisible();
  await expect(tutorPage.getByText("Disponível no horário")).toBeVisible();

  await walkerContext.close();
  await tutorContext.close();
});
