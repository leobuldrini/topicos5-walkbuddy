import { expect, test } from "vitest";
import { summarizeEarnings } from "@/lib/walks/earnings";

test("sums only completed walks", () => {
  const result = summarizeEarnings([
    { status: "concluido", price_estimate: 30 },
    { status: "concluido", price_estimate: 20 },
    { status: "cancelado", price_estimate: 99 },
  ]);

  expect(result).toEqual({ completed: 2, total: 50 });
});
