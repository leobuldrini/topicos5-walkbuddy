import { expect, test } from "vitest";
import { buildNotification } from "@/lib/notify";

test("builds a notification row", () => {
  expect(buildNotification("u1", "walk.accepted", { id: "w1" })).toMatchObject({
    user_id: "u1",
    type: "walk.accepted",
    payload: { id: "w1" },
    read: false,
  });
});
