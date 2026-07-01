import { createServerClient } from "@/lib/supabase/server";

export async function getProfile() {
  const sb = await createServerClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb.from("profiles").select("id, display_name, roles, is_admin").eq("id", u.user.id).single();
  return data;
}

export const hasRole = (p: { roles: string[] } | null, r: "tutor" | "walker") => !!p?.roles.includes(r);
