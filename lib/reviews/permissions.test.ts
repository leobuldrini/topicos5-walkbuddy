import { expect, test } from "vitest";
import { canReviewTarget } from "@/lib/reviews/permissions";

const completedWalk = {
  status: "concluido",
  tutor_id: "tutor-1",
  walker_id: "walker-1",
  pet_id: "pet-1",
};

test("tutor can review walker after completed walk", () => {
  expect(canReviewTarget(completedWalk, "tutor-1", { targetType: "walker", targetId: "walker-1" })).toBe(true);
});

test("walker can review tutor and pet after completed walk", () => {
  expect(canReviewTarget(completedWalk, "walker-1", { targetType: "tutor", targetId: "tutor-1" })).toBe(true);
  expect(canReviewTarget(completedWalk, "walker-1", { targetType: "pet", targetId: "pet-1" })).toBe(true);
});

test("rejects outsiders, wrong targets, and unfinished walks", () => {
  expect(canReviewTarget(completedWalk, "outsider", { targetType: "walker", targetId: "walker-1" })).toBe(false);
  expect(canReviewTarget(completedWalk, "tutor-1", { targetType: "tutor", targetId: "tutor-1" })).toBe(false);
  expect(canReviewTarget({ ...completedWalk, status: "aceito" }, "tutor-1", { targetType: "walker", targetId: "walker-1" })).toBe(false);
});
