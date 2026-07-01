type PetSize = "PEQUENO" | "MEDIO" | "GRANDE";

const SIZE_MULTIPLIER: Record<PetSize, number> = {
  PEQUENO: 1,
  MEDIO: 1.15,
  GRANDE: 1.3,
};

export function estimatePrice(input: { basePrice: number; durationMin: number; size: PetSize }): number {
  const raw = input.basePrice * (input.durationMin / 60) * SIZE_MULTIPLIER[input.size];
  return Math.round(raw * 100) / 100;
}
