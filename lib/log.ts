import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export interface LogInput {
  actorId?: string; action: string; entity: string;
  entityId?: string; metadata?: Record<string, unknown>;
}
export function buildLogRow(i: LogInput) {
  return { actor_id: i.actorId ?? null, action: i.action, entity: i.entity,
    entity_id: i.entityId ?? null, metadata: (i.metadata ?? {}) as Json };
}
export async function logAction(i: LogInput) {
  await createAdminClient().from("action_logs").insert(buildLogRow(i));
}
