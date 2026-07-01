import { expect, test } from "vitest";
import { isAvailableAt } from "@/lib/walks/matching";

const slots = [{ weekday: 1, start_time: "08:00", end_time: "12:00" }];

test("inside slot is available", () => {
  expect(isAvailableAt(slots, 1, "09:00")).toBe(true);
});

test("outside slot is not available", () => {
  expect(isAvailableAt(slots, 1, "13:00")).toBe(false);
});

test("wrong weekday is not available", () => {
  expect(isAvailableAt(slots, 2, "09:00")).toBe(false);
});
