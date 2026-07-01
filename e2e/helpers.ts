import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const PASSWORD = "secret123";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

export async function signUp(page: Page, input: { name: string; email: string; roles: ("tutor" | "walker")[] }) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill(input.name);
  await page.getByLabel("E-mail").fill(input.email);
  await page.getByLabel("Senha").fill(PASSWORD);
  if (input.roles.includes("tutor")) await page.getByLabel("Tutor(a) de pet").check();
  if (input.roles.includes("walker")) await page.getByLabel("Passeador(a)").check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function createPet(page: Page, name: string, size: "PEQUENO" | "MEDIO" | "GRANDE" = "GRANDE") {
  await page.goto("/pets/new");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Porte").selectOption(size);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/pets/);
  await expect(page.getByText(name)).toBeVisible();
}

export async function saveWalkerProfile(page: Page, region = "Centro", price = "20") {
  await page.goto("/walker");
  await page.getByLabel("Anos de experiência").fill("3");
  await page.getByLabel("Preço base (R$)").fill(price);
  await page.getByLabel("Região de atendimento").fill(region);
  await page.getByLabel("Comportamentos aceitos").fill("calmo");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
}

export async function addAvailability(page: Page, weekday = "1", start = "08:00", end = "12:00") {
  await page.goto("/walker");
  await page.getByLabel("Dia da semana").selectOption(weekday);
  await page.getByLabel("Início").fill(start);
  await page.getByLabel("Fim").fill(end);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText(/08:00/)).toBeVisible();
}

export async function createWalkRequest(page: Page, input: { petName: string; region?: string; date?: string; time?: string }) {
  await page.goto("/walks/new");
  await page.getByLabel("Pet").selectOption({ label: input.petName });
  await page.getByLabel("Região").fill(input.region ?? "Centro");
  await page.getByLabel("Data").fill(input.date ?? "2026-07-06");
  await page.getByLabel("Horário").fill(input.time ?? "09:00");
  await page.getByLabel("Duração (minutos)").fill("60");
  await page.getByRole("button", { name: "Solicitar passeio" }).click();
  await expect(page).toHaveURL(/\/walks\/[0-9a-f-]+/);
}

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are required for e2e admin helpers");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function promoteAdminByDisplayName(displayName: string) {
  const admin = adminClient();
  const { data, error } = await admin.from("profiles").select("id").eq("display_name", displayName).single();
  if (error || !data) throw error ?? new Error("Admin profile not found");
  const { error: updateError } = await admin.from("profiles").update({ is_admin: true }).eq("id", data.id);
  if (updateError) throw updateError;
}
