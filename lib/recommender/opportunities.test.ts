import { expect, test } from "vitest";
import { rankOpportunities } from "@/lib/recommender/opportunities";
import type { Candidate } from "@/lib/recommender/types";

const walker: Candidate = {
  walkerId: "w1",
  region: "Centro",
  serviceRegion: "Centro",
  slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
  acceptsSizes: ["GRANDE"],
  acceptsBehaviors: ["calmo"],
  experienceYears: 3,
  basePrice: 20,
  avgRating: 4,
  active: true,
};

test("filters non-matching region and ranks matching opportunities", () => {
  const ranked = rankOpportunities({
    walker,
    requests: [
      { id: "ok", region: "Centro", weekday: 1, startTime: "09:00", petSize: "GRANDE", petBehavior: "calmo", expectedPrice: 20 },
      { id: "no", region: "Norte", weekday: 1, startTime: "09:00", petSize: "GRANDE", petBehavior: "calmo", expectedPrice: 20 },
    ],
  });

  expect(ranked.map((item) => item.requestId)).toEqual(["ok"]);
});
