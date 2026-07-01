import { expect, test } from "@playwright/test";
import {
  addAvailability,
  createPet,
  createWalkRequest,
  promoteAdminByDisplayName,
  saveWalkerProfile,
  signUp,
  uniqueEmail,
} from "./helpers";

test("CT-USU-10 review, notification, report, and admin gate", async ({ browser }) => {
  const walkerContext = await browser.newContext();
  const walkerPage = await walkerContext.newPage();
  await signUp(walkerPage, { name: "Walker Social", email: uniqueEmail("social-walker"), roles: ["walker"] });
  await saveWalkerProfile(walkerPage, "Centro", "20");
  await addAvailability(walkerPage);

  const tutorContext = await browser.newContext();
  const tutorPage = await tutorContext.newPage();
  await signUp(tutorPage, { name: "Tutor Social", email: uniqueEmail("social-tutor"), roles: ["tutor"] });
  await createPet(tutorPage, "Rex Social");
  await createWalkRequest(tutorPage, { petName: "Rex Social" });
  await tutorPage.getByRole("button", { name: "Escolher" }).first().click();

  await walkerPage.goto("/walker/requests");
  await walkerPage.getByRole("button", { name: "Aceitar" }).first().click();
  await walkerPage.getByRole("button", { name: "Iniciar" }).first().click();
  await walkerPage.getByRole("button", { name: "Concluir" }).first().click();

  await tutorPage.goto("/notifications");
  await expect(tutorPage.getByText("walk.accepted")).toBeVisible();

  await tutorPage.goto("/walks");
  await tutorPage.getByRole("link", { name: "Ver detalhes" }).first().click();
  await tutorPage.getByLabel("Nota").first().selectOption("5");
  await tutorPage.getByRole("button", { name: "Avaliar" }).first().click();
  await expect(tutorPage.getByText("Avaliação registrada.")).toBeVisible();

  await tutorPage.getByLabel("Motivo da denúncia").fill("Comportamento inadequado");
  await tutorPage.getByRole("button", { name: "Enviar denúncia" }).click();
  await expect(tutorPage.getByText("Denúncia enviada.")).toBeVisible();

  await tutorPage.goto("/admin");
  await expect(tutorPage).toHaveURL(/\/dashboard/);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const adminName = "Admin Social";
  await signUp(adminPage, { name: adminName, email: uniqueEmail("admin"), roles: ["tutor"] });
  await promoteAdminByDisplayName(adminName);
  await adminPage.goto("/admin/reports");
  await expect(adminPage.getByText("Comportamento inadequado")).toBeVisible();

  await walkerContext.close();
  await tutorContext.close();
  await adminContext.close();
});
