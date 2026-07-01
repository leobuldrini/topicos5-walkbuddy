import { expect, test } from "vitest";
import { reportSchema } from "@/lib/validation/report";

test("requires reason and reported user", () => {
  expect(reportSchema.safeParse({ reportedUserId: "", reason: "x" }).success).toBe(false);
  expect(reportSchema.safeParse({ reportedUserId: "u2", reason: "Comportamento inadequado" }).success).toBe(true);
});
