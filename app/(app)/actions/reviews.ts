"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { canReviewTarget } from "@/lib/reviews/permissions";
import { createServerClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation/review";

export async function submitReview(fd: FormData) {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse({
    walkRequestId: fd.get("walkRequestId"),
    targetType: fd.get("targetType"),
    targetId: fd.get("targetId"),
    rating: fd.get("rating"),
    comment: fd.get("comment") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const sb = await createServerClient();
  const { data: walk } = await sb
    .from("walk_requests")
    .select("status, tutor_id, walker_id, pet_id")
    .eq("id", parsed.data.walkRequestId)
    .single();
  if (
    !walk ||
    !canReviewTarget(walk, user.id, {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
    })
  ) {
    return { error: "Você não pode avaliar este alvo" };
  }

  const { error } = await sb.from("reviews").insert({
    walk_request_id: parsed.data.walkRequestId,
    author_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });
  if (error) return { error: "Você já avaliou este passeio" };

  await logAction({ actorId: user.id, action: "review.create", entity: "reviews", entityId: parsed.data.walkRequestId });
  revalidatePath("/walks");
  revalidatePath(`/walks/${parsed.data.walkRequestId}`);
  return { ok: true };
}
