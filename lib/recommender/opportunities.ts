import { rankWalkers } from "@/lib/recommender/rank";
import type { Candidate, Explanation, PetSize, RankInput } from "@/lib/recommender/types";

export interface OpenRequest {
  id: string;
  region: string;
  weekday: number;
  startTime: string;
  petSize: PetSize;
  petBehavior: string;
  expectedPrice: number;
}

export function rankOpportunities(input: { walker: Candidate; requests: OpenRequest[] }): {
  requestId: string;
  score: number;
  reasons: Explanation[];
}[] {
  const ranked = [];

  for (const request of input.requests) {
    const rankInput: RankInput = {
      requestId: request.id,
      region: request.region,
      weekday: request.weekday,
      startTime: request.startTime,
      petSize: request.petSize,
      petBehavior: request.petBehavior,
      expectedPrice: request.expectedPrice,
      candidates: [input.walker],
    };
    const [result] = rankWalkers(rankInput);
    if (result) ranked.push({ requestId: request.id, score: result.score, reasons: result.reasons });
  }

  return ranked.sort((a, b) => b.score - a.score);
}
