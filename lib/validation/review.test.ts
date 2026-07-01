import { expect, test } from "vitest";
import { reviewSchema } from "@/lib/validation/review";

test("rating must be within 1 and 5", () => {
  expect(reviewSchema.safeParse({ walkRequestId: "w1", targetType: "walker", targetId: "u1", rating: 0 }).success).toBe(false);
  expect(reviewSchema.safeParse({ walkRequestId: "w1", targetType: "walker", targetId: "u1", rating: 5 }).success).toBe(true);
});
