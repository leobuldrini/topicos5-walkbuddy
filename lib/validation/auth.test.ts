import { expect, test } from "vitest";
import { signupSchema } from "@/lib/validation/auth";

test("rejects empty roles", () => {
  const r = signupSchema.safeParse({ email: "a@b.com", password: "secret12", displayName: "A", roles: [] });
  expect(r.success).toBe(false);
});
test("accepts tutor+walker", () => {
  const r = signupSchema.safeParse({ email: "a@b.com", password: "secret12", displayName: "A", roles: ["tutor","walker"] });
  expect(r.success).toBe(true);
});
