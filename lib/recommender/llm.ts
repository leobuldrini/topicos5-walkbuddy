import type { Explanation, RankInput, RankedWalker } from "@/lib/recommender/types";

interface LlmChoice {
  walkerId: string;
  reason: string;
  confidence?: number;
}

const DEFAULT_OPENROUTER_MODEL = "cohere/north-mini-code:free";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_TIMEOUT_MS = 8000;

export function extractLlmChoice(content: string | null | undefined): LlmChoice | null {
  if (!content) return null;

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<LlmChoice>;
    if (typeof parsed.walkerId !== "string" || parsed.walkerId.trim() === "") return null;
    if (typeof parsed.reason !== "string" || parsed.reason.trim() === "") return null;

    return {
      walkerId: parsed.walkerId,
      reason: parsed.reason,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
    };
  } catch {
    return null;
  }
}

export async function rerankWithLlm(input: RankInput, localRanked: RankedWalker[]): Promise<RankedWalker[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || localRanked.length < 2) return localRanked;

  try {
    const choice = await requestLlmChoice(input, localRanked, apiKey);
    if (!choice) return localRanked;

    const selectedIndex = localRanked.findIndex((walker) => walker.walkerId === choice.walkerId);
    if (selectedIndex < 0) return localRanked;

    const selected = localRanked[selectedIndex];
    const topScore = Math.max(...localRanked.map((walker) => walker.score));
    const aiReason: Explanation = {
      criterion: "experience",
      contribution: choice.confidence ?? 0,
      label: `Escolha da IA: ${choice.reason}`,
    };
    const promoted: RankedWalker = {
      ...selected,
      score: Math.max(selected.score, topScore + 0.001),
      reasons: [aiReason, ...selected.reasons].slice(0, 3),
    };

    return [promoted, ...localRanked.filter((walker) => walker.walkerId !== choice.walkerId)];
  } catch {
    return localRanked;
  }
}

async function requestLlmChoice(input: RankInput, localRanked: RankedWalker[], apiKey: string): Promise<LlmChoice | null> {
  const baseUrl = process.env.OPENROUTER_BASE_URL ?? DEFAULT_OPENROUTER_BASE_URL;
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
  const timeout = Number(process.env.OPENROUTER_TIMEOUT_MS ?? DEFAULT_OPENROUTER_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_OPENROUTER_TIMEOUT_MS);

  try {
    let response = await postOpenRouter(baseUrl, apiKey, model, input, localRanked, controller.signal, true);
    if (!response.ok) response = await postOpenRouter(baseUrl, apiKey, model, input, localRanked, controller.signal, false);
    if (!response.ok) return null;

    const payload = (await response.json()) as { choices?: { message?: { content?: string | null } }[] };
    return extractLlmChoice(payload.choices?.[0]?.message?.content);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function postOpenRouter(
  baseUrl: string,
  apiKey: string,
  model: string,
  input: RankInput,
  localRanked: RankedWalker[],
  signal: AbortSignal,
  reasoning: boolean,
) {
  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content:
          "Voce escolhe o melhor passeador elegivel para uma solicitacao. Responda somente JSON valido no formato {\"walkerId\":\"...\",\"reason\":\"...\",\"confidence\":0.0}.",
      },
      {
        role: "user",
        content: buildPrompt(input, localRanked),
      },
    ],
  };
  if (reasoning) body.reasoning = { enabled: true };

  return fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify(body),
  });
}

function buildPrompt(input: RankInput, localRanked: RankedWalker[]) {
  const candidatesById = new Map(input.candidates.map((candidate) => [candidate.walkerId, candidate]));
  const candidates = localRanked
    .map((ranked, index) => {
      const candidate = candidatesById.get(ranked.walkerId);
      return {
        localRank: index + 1,
        walkerId: ranked.walkerId,
        localScore: Number(ranked.score.toFixed(4)),
        serviceRegion: candidate?.serviceRegion,
        experienceYears: candidate?.experienceYears,
        basePrice: candidate?.basePrice,
        avgRating: candidate?.avgRating,
        acceptsBehaviors: candidate?.acceptsBehaviors,
        reasons: ranked.reasons.map((reason) => reason.label),
      };
    });

  return JSON.stringify({
    request: {
      region: input.region,
      weekday: input.weekday,
      startTime: input.startTime,
      petSize: input.petSize,
      petBehavior: input.petBehavior,
      expectedPrice: input.expectedPrice,
    },
    candidates,
    rule: "Escolha exatamente um walkerId da lista de candidatos. Nao invente IDs.",
  });
}
