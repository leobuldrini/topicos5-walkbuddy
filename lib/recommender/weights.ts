import type { Weights } from "@/lib/recommender/types";

export function defaultWeights(): Weights {
  return { region: 3, availability: 3, size: 2, behavior: 1, experience: 1, price: 1.5, rating: 2 };
}

export function normalizeWeights(weights: Weights): Weights {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return Object.fromEntries(
    Object.entries(weights).map(([criterion, weight]) => [criterion, total === 0 ? 0 : weight / total]),
  ) as Weights;
}
