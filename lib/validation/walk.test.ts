import { expect, test } from "vitest";
import { walkSchema } from "@/lib/validation/walk";

test("requires pet, date, time, duration, and region", () => {
  expect(
    walkSchema.safeParse({
      petId: "",
      region: "Centro",
      date: "2026-07-10",
      startTime: "09:00",
      durationMin: 60,
    }).success,
  ).toBe(false);

  expect(
    walkSchema.safeParse({
      petId: "p1",
      region: "Centro",
      date: "2026-07-10",
      startTime: "09:00",
      durationMin: 60,
    }).success,
  ).toBe(true);
});

test("rejects invalid duration", () => {
  expect(
    walkSchema.safeParse({
      petId: "p1",
      region: "Centro",
      date: "2026-07-10",
      startTime: "09:00",
      durationMin: 0,
    }).success,
  ).toBe(false);
});
