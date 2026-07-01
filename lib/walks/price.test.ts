import { expect, test } from "vitest";
import { estimatePrice } from "@/lib/walks/price";

test("scales with duration and pet size", () => {
  expect(estimatePrice({ basePrice: 20, durationMin: 60, size: "PEQUENO" })).toBe(20);
  expect(estimatePrice({ basePrice: 20, durationMin: 60, size: "GRANDE" })).toBe(26);
  expect(estimatePrice({ basePrice: 20, durationMin: 30, size: "MEDIO" })).toBe(11.5);
});
