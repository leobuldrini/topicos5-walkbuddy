import { expect, test } from "vitest";
import { canWalkerServeWalk, isAvailableAt } from "@/lib/walks/matching";

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

const compatibleWalker = {
  active: true,
  service_region: "Centro",
  accepted_sizes: ["GRANDE"],
  availability: slots,
};

test("walker can serve matching active region size and slot", () => {
  expect(
    canWalkerServeWalk(compatibleWalker, {
      region: "centro",
      weekday: 1,
      startTime: "09:00",
      petSize: "GRANDE",
    }),
  ).toBe(true);
});

test("walker cannot serve incompatible walk", () => {
  expect(
    canWalkerServeWalk({ ...compatibleWalker, accepted_sizes: ["PEQUENO"] }, {
      region: "Centro",
      weekday: 1,
      startTime: "09:00",
      petSize: "GRANDE",
    }),
  ).toBe(false);
});
