export type Criterion = "region" | "availability" | "size" | "behavior" | "experience" | "price" | "rating";
export type PetSize = "PEQUENO" | "MEDIO" | "GRANDE";

export interface Candidate {
  walkerId: string;
  region: string;
  serviceRegion: string;
  slots: { weekday: number; start_time: string; end_time: string }[];
  acceptsSizes: PetSize[];
  acceptsBehaviors: string[];
  experienceYears: number;
  basePrice: number;
  avgRating: number | null;
  active: boolean;
}

export interface RankInput {
  requestId: string;
  region: string;
  weekday: number;
  startTime: string;
  petSize: PetSize;
  petBehavior: string;
  expectedPrice: number;
  candidates: Candidate[];
}

export interface Explanation {
  criterion: Criterion;
  contribution: number;
  label: string;
}

export interface RankedWalker {
  walkerId: string;
  score: number;
  reasons: Explanation[];
}

export type Weights = Record<Criterion, number>;
