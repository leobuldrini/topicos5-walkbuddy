import { expect, test } from "vitest";
import { rankWalkers } from "@/lib/recommender/rank";
import type { Candidate, RankInput } from "@/lib/recommender/types";

const mk = (walkerId: string, avgRating: number): Candidate => ({
  walkerId,
  region: "Centro",
  serviceRegion: "Centro",
  slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
  acceptsSizes: ["GRANDE"],
  acceptsBehaviors: ["calmo"],
  experienceYears: 3,
  basePrice: 20,
  avgRating,
  active: true,
});

const input = (candidates: Candidate[]): RankInput => ({
  requestId: "r",
  region: "Centro",
  weekday: 1,
  startTime: "09:00",
  petSize: "GRANDE",
  petBehavior: "calmo",
  expectedPrice: 20,
  candidates,
});

test("higher rating ranks first when else equal", () => {
  const ranked = rankWalkers(input([mk("low", 3), mk("high", 5)]));
  expect(ranked[0].walkerId).toBe("high");
});

test("explanation lists top criteria", () => {
  const ranked = rankWalkers(input([mk("w1", 5)]));
  expect(ranked[0].reasons.length).toBeGreaterThan(0);
  expect(ranked[0].reasons[0]).toHaveProperty("label");
});

test("no eligible candidates returns empty", () => {
  expect(rankWalkers(input([{ ...mk("w1", 5), serviceRegion: "Norte" }]))).toHaveLength(0);
});
