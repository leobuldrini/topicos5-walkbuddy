import type { Candidate, Criterion, RankInput } from "@/lib/recommender/types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function scoreCandidate(candidate: Candidate, input: RankInput): Record<Criterion, number> {
  const behaviorMatches = candidate.acceptsBehaviors
    .map((behavior) => behavior.toLowerCase())
    .includes(input.petBehavior.toLowerCase());
  const price =
    input.expectedPrice <= 0 ? 0.5 : clamp01(1 - Math.abs(candidate.basePrice - input.expectedPrice) / input.expectedPrice);

  return {
    region: candidate.serviceRegion.toLowerCase() === input.region.toLowerCase() ? 1 : 0,
    availability: 1,
    size: candidate.acceptsSizes.includes(input.petSize) ? 1 : 0,
    behavior: behaviorMatches ? 1 : 0.5,
    experience: clamp01(candidate.experienceYears / 10),
    price,
    rating: candidate.avgRating === null ? 0.6 : clamp01(candidate.avgRating / 5),
  };
}
