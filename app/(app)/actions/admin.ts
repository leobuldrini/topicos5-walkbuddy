"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { logAction } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/database.types";

export async function setReportStatus(id: string, status: Enums<"report_status">) {
  const user = await requireAdmin();
  const { error } = await createAdminClient().from("reports").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível atualizar a denúncia" };
  await logAction({ actorId: user.id, action: "admin.report_status", entity: "reports", entityId: id, metadata: { status } });
  revalidatePath("/admin/reports");
  return { ok: true };
}
