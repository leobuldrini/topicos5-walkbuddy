type ReviewTarget = "walker" | "tutor" | "pet";

interface ReviewableWalk {
  status: string;
  tutor_id: string;
  walker_id: string | null;
  pet_id: string;
}

export function canReviewTarget(
  walk: ReviewableWalk,
  userId: string,
  target: { targetType: ReviewTarget; targetId: string },
): boolean {
  if (walk.status !== "concluido") return false;

  if (userId === walk.tutor_id) {
    return target.targetType === "walker" && target.targetId === walk.walker_id;
  }

  if (userId === walk.walker_id) {
    return (
      (target.targetType === "tutor" && target.targetId === walk.tutor_id) ||
      (target.targetType === "pet" && target.targetId === walk.pet_id)
    );
  }

  return false;
}
