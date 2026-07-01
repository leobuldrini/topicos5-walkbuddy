import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const sb = await createServerClient();
  const { data } = await sb.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
