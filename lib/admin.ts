import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) redirect("/dashboard");
  return user;
}
