import { isAvailableAt } from "@/lib/walks/matching";
import type { Candidate, RankInput } from "@/lib/recommender/types";

export function filterCandidates(input: RankInput): {
  eligible: Candidate[];
  rejected: { walkerId: string; reason: string }[];
} {
  const eligible: Candidate[] = [];
  const rejected: { walkerId: string; reason: string }[] = [];

  for (const candidate of input.candidates) {
    if (!candidate.active) {
      rejected.push({ walkerId: candidate.walkerId, reason: "Perfil inativo" });
      continue;
    }
    if (candidate.serviceRegion.toLowerCase() !== input.region.toLowerCase()) {
      rejected.push({ walkerId: candidate.walkerId, reason: "Fora da região" });
      continue;
    }
    if (!isAvailableAt(candidate.slots, input.weekday, input.startTime)) {
      rejected.push({ walkerId: candidate.walkerId, reason: "Sem disponibilidade no horário" });
      continue;
    }
    if (!candidate.acceptsSizes.includes(input.petSize)) {
      rejected.push({ walkerId: candidate.walkerId, reason: "Não atende o porte do pet" });
      continue;
    }
    eligible.push(candidate);
  }

  return { eligible, rejected };
}
