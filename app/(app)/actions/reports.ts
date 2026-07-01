"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { createServerClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation/report";

export async function submitReport(fd: FormData) {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    reportedUserId: fd.get("reportedUserId"),
    walkRequestId: fd.get("walkRequestId") || undefined,
    reason: fd.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const sb = await createServerClient();
  const { data, error } = await sb
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_user_id: parsed.data.reportedUserId,
      walk_request_id: parsed.data.walkRequestId ?? null,
      reason: parsed.data.reason,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível enviar a denúncia" };

  await logAction({ actorId: user.id, action: "report.create", entity: "reports", entityId: data.id });
  revalidatePath("/walks");
  return { ok: true };
}
