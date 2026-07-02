import { afterEach, describe, expect, test, vi } from "vitest";
import { extractLlmChoice, rerankWithLlm } from "@/lib/recommender/llm";
import type { Candidate, RankInput, RankedWalker } from "@/lib/recommender/types";

const candidate = (walkerId: string): Candidate => ({
  walkerId,
  region: "Centro",
  serviceRegion: "Centro",
  slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
  acceptsSizes: ["GRANDE"],
  acceptsBehaviors: ["calmo"],
  experienceYears: walkerId === "w2" ? 5 : 2,
  basePrice: walkerId === "w2" ? 22 : 20,
  avgRating: walkerId === "w2" ? 4.8 : 4.1,
  active: true,
});

const input: RankInput = {
  requestId: "r1",
  region: "Centro",
  weekday: 1,
  startTime: "09:00",
  petSize: "GRANDE",
  petBehavior: "calmo",
  expectedPrice: 20,
  candidates: [candidate("w1"), candidate("w2")],
};

const ranked: RankedWalker[] = [
  {
    walkerId: "w1",
    score: 0.9,
    reasons: [{ criterion: "price", contribution: 0.2, label: "Preco adequado" }],
  },
  {
    walkerId: "w2",
    score: 0.85,
    reasons: [{ criterion: "rating", contribution: 0.2, label: "Boa avaliacao" }],
  },
];

describe("extractLlmChoice", () => {
  test("extracts JSON from fenced assistant content", () => {
    expect(extractLlmChoice('```json\n{"walkerId":"w2","reason":"Melhor combinacao","confidence":0.91}\n```')).toEqual({
      walkerId: "w2",
      reason: "Melhor combinacao",
      confidence: 0.91,
    });
  });

  test("returns null for invalid JSON", () => {
    expect(extractLlmChoice("Escolha o passeador w2")).toBeNull();
  });
});

describe("rerankWithLlm", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("puts the LLM selected eligible walker first", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: '{"walkerId":"w2","reason":"Mais experiencia","confidence":0.88}' } }],
        }),
      ),
    );

    const result = await rerankWithLlm(input, ranked);

    expect(result.map((item) => item.walkerId)).toEqual(["w2", "w1"]);
    expect(result[0].reasons[0]).toMatchObject({ criterion: "experience", label: "Escolha da IA: Mais experiencia" });
  });

  test("keeps local ranking when the LLM selects an unknown walker", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: '{"walkerId":"missing","reason":"Nao existe","confidence":0.9}' } }],
        }),
      ),
    );

    await expect(rerankWithLlm(input, ranked)).resolves.toEqual(ranked);
  });
});
