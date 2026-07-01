import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/lib/database.types";

export function buildNotification(userId: string, type: string, payload: Record<string, unknown>) {
  return { user_id: userId, type, payload, read: false };
}

export async function notify(userId: string, type: string, payload: Record<string, unknown>) {
  const row: TablesInsert<"notifications"> = {
    ...buildNotification(userId, type, payload),
    payload: payload as Json,
  };
  await createAdminClient().from("notifications").insert(row);
}
