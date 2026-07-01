import { expect, test } from "vitest";
import { defaultWeights, normalizeWeights } from "@/lib/recommender/weights";

test("default weights sum to 1 after normalize", () => {
  const weights = normalizeWeights(defaultWeights());
  const sum = Object.values(weights).reduce((total, value) => total + value, 0);
  expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
});
