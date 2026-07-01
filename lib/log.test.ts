import { expect, test, vi } from "vitest";
import { buildLogRow } from "@/lib/log";

test("buildLogRow maps input to a valid row", () => {
  const row = buildLogRow({ actorId: "u1", action: "pet.create", entity: "pets", entityId: "p1" });
  expect(row).toMatchObject({ actor_id: "u1", action: "pet.create", entity: "pets", entity_id: "p1", metadata: {} });
});
