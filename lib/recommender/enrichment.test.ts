import { expect, test } from "vitest";
import { noopEnricher } from "@/lib/recommender/enrichment";

test("noop enricher returns empty context", async () => {
  await expect(noopEnricher.enrich("Centro")).resolves.toEqual({ region: "Centro", signals: {} });
});
