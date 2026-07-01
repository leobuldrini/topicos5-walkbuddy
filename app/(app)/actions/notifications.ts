"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function markRead(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { error } = await sb.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Não foi possível marcar como lida" };
  revalidatePath("/notifications");
  return { ok: true };
}
