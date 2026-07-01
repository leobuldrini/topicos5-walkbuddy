import { expect, test } from "vitest";
import { walkerSchema, availabilitySchema } from "@/lib/validation/walker";
test("base_price non-negative", () => {
  expect(walkerSchema.safeParse({ bio:"", experienceYears:1, basePrice:-1, serviceRegion:"Centro" }).success).toBe(false);
});
test("availability end after start", () => {
  expect(availabilitySchema.safeParse({ weekday:1, startTime:"10:00", endTime:"09:00" }).success).toBe(false);
  expect(availabilitySchema.safeParse({ weekday:1, startTime:"09:00", endTime:"10:00" }).success).toBe(true);
});
