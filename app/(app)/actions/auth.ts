"use server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/log";
import { signupSchema, loginSchema } from "@/lib/validation/auth";

export async function signUp(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"), password: formData.get("password"),
    displayName: formData.get("displayName"), roles: formData.getAll("roles"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createServerClient();
  const { data, error } = await sb.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) return { error: "Não foi possível criar a conta" };
  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, display_name: parsed.data.displayName, roles: parsed.data.roles });
  if (profileError) {
    try {
      await admin.auth.admin.deleteUser(data.user.id);
    } catch {
      // best-effort cleanup; ignore failure
    }
    return { error: "Não foi possível concluir o cadastro" };
  }
  await logAction({ actorId: data.user.id, action: "auth.signup", entity: "profiles", entityId: data.user.id });
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createServerClient();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Credenciais inválidas" };
  redirect("/dashboard");
}
