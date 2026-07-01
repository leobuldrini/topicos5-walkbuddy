import { filterCandidates } from "@/lib/recommender/filters";
import { scoreCandidate } from "@/lib/recommender/scoring";
import type { Criterion, Explanation, RankInput, RankedWalker, Weights } from "@/lib/recommender/types";
import { defaultWeights, normalizeWeights } from "@/lib/recommender/weights";

const LABEL: Record<Criterion, string> = {
  region: "Atende sua região",
  availability: "Disponível no horário",
  size: "Aceita o porte do pet",
  behavior: "Compatível com o comportamento",
  experience: "Experiência relevante",
  price: "Preço adequado",
  rating: "Boa avaliação",
};

export function rankWalkers(input: RankInput, weights?: Weights): RankedWalker[] {
  const normalized = normalizeWeights(weights ?? defaultWeights());
  const { eligible } = filterCandidates(input);

  return eligible
    .map((candidate) => {
      const score = scoreCandidate(candidate, input);
      const contributions = (Object.keys(normalized) as Criterion[]).map((criterion) => ({
        criterion,
        contribution: normalized[criterion] * score[criterion],
        label: LABEL[criterion],
      }));
      const total = contributions.reduce((sum, item) => sum + item.contribution, 0);
      const reasons: Explanation[] = contributions
        .filter((item) => item.contribution > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3);

      return {
        walkerId: candidate.walkerId,
        score: total,
        reasons,
        ratingTieBreak: candidate.avgRating ?? 0,
        experienceTieBreak: candidate.experienceYears,
      };
    })
    .sort((a, b) => b.score - a.score || b.ratingTieBreak - a.ratingTieBreak || b.experienceTieBreak - a.experienceTieBreak)
    .map(({ walkerId, score, reasons }) => ({ walkerId, score, reasons }));
}
