import { expect, test } from "vitest";
import { petSchema } from "@/lib/validation/pet";
test("requires name and size", () => {
  expect(petSchema.safeParse({ name: "", size: "GRANDE" }).success).toBe(false);
  expect(petSchema.safeParse({ name: "Rex", size: "GRANDE" }).success).toBe(true);
});
test("rejects invalid size", () => {
  expect(petSchema.safeParse({ name: "Rex", size: "HUGE" }).success).toBe(false);
});
