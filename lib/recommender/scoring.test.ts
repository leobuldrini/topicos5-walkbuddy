import { expect, test } from "vitest";
import { scoreCandidate } from "@/lib/recommender/scoring";
import type { Candidate, RankInput } from "@/lib/recommender/types";

const candidate: Candidate = {
  walkerId: "w1",
  region: "Centro",
  serviceRegion: "Centro",
  slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
  acceptsSizes: ["GRANDE"],
  acceptsBehaviors: ["calmo"],
  experienceYears: 5,
  basePrice: 20,
  avgRating: 5,
  active: true,
};

const input: RankInput = {
  requestId: "r",
  region: "Centro",
  weekday: 1,
  startTime: "09:00",
  petSize: "GRANDE",
  petBehavior: "calmo",
  expectedPrice: 20,
  candidates: [candidate],
};

test("perfect match scores high on rating, region, and price", () => {
  const score = scoreCandidate(candidate, input);
  expect(score.region).toBe(1);
  expect(score.rating).toBe(1);
  expect(score.price).toBe(1);
});

test("null rating uses neutral prior", () => {
  expect(scoreCandidate({ ...candidate, avgRating: null }, input).rating).toBeCloseTo(0.6);
});
