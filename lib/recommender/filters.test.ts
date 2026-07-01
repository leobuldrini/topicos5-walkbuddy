import { expect, test } from "vitest";
import { filterCandidates } from "@/lib/recommender/filters";
import type { Candidate, RankInput } from "@/lib/recommender/types";

const base: Candidate = {
  walkerId: "w1",
  region: "Centro",
  serviceRegion: "Centro",
  slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
  acceptsSizes: ["GRANDE"],
  acceptsBehaviors: ["calmo"],
  experienceYears: 3,
  basePrice: 20,
  avgRating: 4.5,
  active: true,
};

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

test("keeps eligible walker", () => {
  expect(filterCandidates(input([base])).eligible.map((candidate) => candidate.walkerId)).toEqual(["w1"]);
});

test("drops unavailable time", () => {
  const candidate = { ...base, slots: [{ weekday: 2, start_time: "08:00", end_time: "12:00" }] };
  const result = filterCandidates(input([candidate]));
  expect(result.eligible).toHaveLength(0);
  expect(result.rejected[0].reason).toMatch(/disponibilidade/i);
});

test("drops incompatible size", () => {
  const candidate = { ...base, acceptsSizes: ["PEQUENO"] as Candidate["acceptsSizes"] };
  expect(filterCandidates(input([candidate])).eligible).toHaveLength(0);
});

test("drops wrong region", () => {
  expect(filterCandidates(input([{ ...base, serviceRegion: "Norte" }])).eligible).toHaveLength(0);
});
