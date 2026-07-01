# Walk Buddy SP3 (Recommender Module) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the recommender stub with an explainable weighted-multicriteria ranker that filters, scores, ranks, explains, logs, and also surfaces opportunities to walkers.

**Architecture:** Pure functions in `lib/recommender/` (no IO). A thin `adapter.ts` loads candidates and writes logs. Deterministic scoring → unit-testable with hand-built fixtures matching the test plan's manual scenarios.

**Tech Stack:** Same as prior SPs. No ML libraries.

## Global Constraints

- Core recommender is pure/deterministic — same input yields same ranking. (RNF16)
- Weights are config-driven and swappable without app restructuring. (RNF17)
- Never recommend incompatible/unavailable walkers — hard filters before scoring. (RF26)
- pt-BR explanation strings. Self-hosted, RLS, action logging, commit per task.

---

### Task 1: Types + weights — RNF17

**Files:**
- Create: `lib/recommender/types.ts`, `lib/recommender/weights.ts`, `lib/recommender/weights.test.ts`

**Interfaces:**
- Produces:
```ts
type Criterion = "region"|"availability"|"size"|"behavior"|"experience"|"price"|"rating";
interface Candidate {
  walkerId: string; region: string; serviceRegion: string;
  slots: { weekday:number; start_time:string; end_time:string }[];
  acceptsSizes: ("PEQUENO"|"MEDIO"|"GRANDE")[];
  acceptsBehaviors: string[]; experienceYears: number; basePrice: number;
  avgRating: number | null; active: boolean;
}
interface RankInput {
  requestId: string; region: string; weekday: number; startTime: string;
  petSize: "PEQUENO"|"MEDIO"|"GRANDE"; petBehavior: string; expectedPrice: number;
  candidates: Candidate[];
}
interface Explanation { criterion: Criterion; contribution: number; label: string }
interface RankedWalker { walkerId: string; score: number; reasons: Explanation[] }
type Weights = Record<Criterion, number>;
```
  - `defaultWeights(): Weights`, `normalizeWeights(w): Weights`

- [ ] **Step 1: Failing test `weights.test.ts`**

```ts
import { expect, test } from "vitest";
import { defaultWeights, normalizeWeights } from "@/lib/recommender/weights";
test("default weights sum to 1 after normalize", () => {
  const w = normalizeWeights(defaultWeights());
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `types.ts` (the interfaces above) and `weights.ts`**

```ts
import type { Weights } from "./types";
export function defaultWeights(): Weights {
  return { region: 3, availability: 3, size: 2, behavior: 1, experience: 1, price: 1.5, rating: 2 };
}
export function normalizeWeights(w: Weights): Weights {
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / total])) as Weights;
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: recommender types + configurable weights (RNF17)"`

---

### Task 2: Hard filters — RF26

**Files:**
- Create: `lib/recommender/filters.ts`, `lib/recommender/filters.test.ts`

**Interfaces:**
- Consumes: `Candidate`, `RankInput`, `isAvailableAt` (from `lib/walks/matching.ts`).
- Produces: `filterCandidates(input): { eligible: Candidate[]; rejected: { walkerId: string; reason: string }[] }`.

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { filterCandidates } from "@/lib/recommender/filters";
import type { Candidate, RankInput } from "@/lib/recommender/types";

const base: Candidate = { walkerId:"w1", region:"Centro", serviceRegion:"Centro",
  slots:[{weekday:1,start_time:"08:00",end_time:"12:00"}], acceptsSizes:["GRANDE"],
  acceptsBehaviors:["calmo"], experienceYears:3, basePrice:20, avgRating:4.5, active:true };
const input = (c: Candidate[]): RankInput => ({ requestId:"r", region:"Centro", weekday:1,
  startTime:"09:00", petSize:"GRANDE", petBehavior:"calmo", expectedPrice:20, candidates:c });

test("keeps eligible walker (CT-IA-01)", () => {
  expect(filterCandidates(input([base])).eligible.map(c=>c.walkerId)).toEqual(["w1"]);
});
test("drops unavailable time (CT-IA-02)", () => {
  const c = { ...base, slots:[{weekday:2,start_time:"08:00",end_time:"12:00"}] };
  const r = filterCandidates(input([c]));
  expect(r.eligible).toHaveLength(0);
  expect(r.rejected[0].reason).toMatch(/disponibilidade/i);
});
test("drops incompatible size (CT-IA-03 filter side)", () => {
  const c = { ...base, acceptsSizes:["PEQUENO"] as Candidate["acceptsSizes"] };
  expect(filterCandidates(input([c])).eligible).toHaveLength(0);
});
test("drops wrong region (CT-IA-04 filter side)", () => {
  const c = { ...base, serviceRegion:"Norte" };
  expect(filterCandidates(input([c])).eligible).toHaveLength(0);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `filters.ts`**

```ts
import type { Candidate, RankInput } from "./types";
import { isAvailableAt } from "@/lib/walks/matching";

export function filterCandidates(input: RankInput) {
  const eligible: Candidate[] = [];
  const rejected: { walkerId: string; reason: string }[] = [];
  for (const c of input.candidates) {
    if (!c.active) { rejected.push({ walkerId: c.walkerId, reason: "Perfil inativo" }); continue; }
    if (c.serviceRegion.toLowerCase() !== input.region.toLowerCase()) {
      rejected.push({ walkerId: c.walkerId, reason: "Fora da região" }); continue; }
    if (!isAvailableAt(c.slots, input.weekday, input.startTime)) {
      rejected.push({ walkerId: c.walkerId, reason: "Sem disponibilidade no horário" }); continue; }
    if (!c.acceptsSizes.includes(input.petSize)) {
      rejected.push({ walkerId: c.walkerId, reason: "Não atende o porte do pet" }); continue; }
    eligible.push(c);
  }
  return { eligible, rejected };
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: recommender hard filters (RF26)"`

---

### Task 3: Per-criterion scoring — RF22

**Files:**
- Create: `lib/recommender/scoring.ts`, `lib/recommender/scoring.test.ts`

**Interfaces:**
- Produces: `scoreCandidate(c: Candidate, input: RankInput): Record<Criterion, number>` — each in [0,1].

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { scoreCandidate } from "@/lib/recommender/scoring";
import type { Candidate, RankInput } from "@/lib/recommender/types";
const c: Candidate = { walkerId:"w1", region:"Centro", serviceRegion:"Centro",
  slots:[{weekday:1,start_time:"08:00",end_time:"12:00"}], acceptsSizes:["GRANDE"],
  acceptsBehaviors:["calmo"], experienceYears:5, basePrice:20, avgRating:5, active:true };
const input: RankInput = { requestId:"r", region:"Centro", weekday:1, startTime:"09:00",
  petSize:"GRANDE", petBehavior:"calmo", expectedPrice:20, candidates:[c] };
test("perfect match scores high on rating & region", () => {
  const s = scoreCandidate(c, input);
  expect(s.region).toBe(1);
  expect(s.rating).toBe(1);
  expect(s.price).toBe(1);
});
test("null rating uses neutral prior 0.6", () => {
  expect(scoreCandidate({ ...c, avgRating: null }, input).rating).toBeCloseTo(0.6);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `scoring.ts`**

```ts
import type { Candidate, Criterion, RankInput } from "./types";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function scoreCandidate(c: Candidate, input: RankInput): Record<Criterion, number> {
  const region = c.serviceRegion.toLowerCase() === input.region.toLowerCase() ? 1 : 0;
  const availability = 1; // survived hard filter; refine by margin if desired
  const size = c.acceptsSizes.includes(input.petSize) ? 1 : 0;
  const behavior = c.acceptsBehaviors.map((b) => b.toLowerCase()).includes(input.petBehavior.toLowerCase()) ? 1 : 0.5;
  const experience = clamp01(c.experienceYears / 10);
  const price = input.expectedPrice <= 0 ? 0.5
    : clamp01(1 - Math.abs(c.basePrice - input.expectedPrice) / input.expectedPrice);
  const rating = c.avgRating === null ? 0.6 : clamp01(c.avgRating / 5);
  return { region, availability, size, behavior, experience, price, rating };
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: recommender per-criterion scoring (RF22)"`

---

### Task 4: Rank + explanation — RF21, RF23

**Files:**
- Create: `lib/recommender/rank.ts`, `lib/recommender/rank.test.ts`

**Interfaces:**
- Consumes: `filterCandidates`, `scoreCandidate`, `defaultWeights`, `normalizeWeights`.
- Produces: `rankWalkers(input: RankInput, weights?: Weights): RankedWalker[]`.

- [ ] **Step 1: Failing test (CT-IA-05, CT-IA-06, CT-IA-08)**

```ts
import { expect, test } from "vitest";
import { rankWalkers } from "@/lib/recommender/rank";
import type { Candidate, RankInput } from "@/lib/recommender/types";
const mk = (id: string, rating: number): Candidate => ({ walkerId:id, region:"Centro",
  serviceRegion:"Centro", slots:[{weekday:1,start_time:"08:00",end_time:"12:00"}],
  acceptsSizes:["GRANDE"], acceptsBehaviors:["calmo"], experienceYears:3, basePrice:20,
  avgRating:rating, active:true });
const input = (c: Candidate[]): RankInput => ({ requestId:"r", region:"Centro", weekday:1,
  startTime:"09:00", petSize:"GRANDE", petBehavior:"calmo", expectedPrice:20, candidates:c });

test("higher rating ranks first when else equal (CT-IA-05)", () => {
  const r = rankWalkers(input([mk("low", 3), mk("high", 5)]));
  expect(r[0].walkerId).toBe("high");
});
test("explanation lists top criteria (CT-IA-06)", () => {
  const r = rankWalkers(input([mk("w1", 5)]));
  expect(r[0].reasons.length).toBeGreaterThan(0);
  expect(r[0].reasons[0]).toHaveProperty("label");
});
test("no eligible candidates -> empty (CT-IA-08)", () => {
  const bad = { ...mk("w1", 5), serviceRegion: "Norte" };
  expect(rankWalkers(input([bad]))).toHaveLength(0);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `rank.ts`**

```ts
import type { Criterion, Explanation, RankInput, RankedWalker, Weights } from "./types";
import { filterCandidates } from "./filters";
import { scoreCandidate } from "./scoring";
import { defaultWeights, normalizeWeights } from "./weights";

const LABEL: Record<Criterion, string> = {
  region: "Atende sua região", availability: "Disponível no horário",
  size: "Aceita o porte do pet", behavior: "Compatível com o comportamento",
  experience: "Experiência relevante", price: "Preço adequado", rating: "Boa avaliação",
};

export function rankWalkers(input: RankInput, weights?: Weights): RankedWalker[] {
  const w = normalizeWeights(weights ?? defaultWeights());
  const { eligible } = filterCandidates(input);
  const ranked = eligible.map((c) => {
    const s = scoreCandidate(c, input);
    const contributions = (Object.keys(w) as Criterion[]).map((k) => ({ criterion: k, contribution: w[k] * s[k], label: LABEL[k] }));
    const score = contributions.reduce((a, e) => a + e.contribution, 0);
    const reasons: Explanation[] = contributions
      .filter((e) => e.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
    return { walkerId: c.walkerId, score, reasons, _rating: c.avgRating ?? 0, _exp: c.experienceYears };
  });
  ranked.sort((a, b) => b.score - a.score || b._rating - a._rating || b._exp - a._exp);
  return ranked.map(({ walkerId, score, reasons }) => ({ walkerId, score, reasons }));
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: recommender ranking + explanations (RF21, RF23)"`

---

### Task 5: Migration — recommendation_logs — RF25

**Files:**
- Create: `supabase/migrations/0004_recommendation_logs.sql`; regenerate types.

- [ ] **Step 1: Migration**

```sql
create table recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  walk_request_id uuid not null references walk_requests(id) on delete cascade,
  walker_id uuid not null references walker_profiles(id) on delete cascade,
  score numeric not null,
  rank int not null,
  factors jsonb not null default '{}',
  shown_at timestamptz not null default now(),
  chosen boolean not null default false,
  created_at timestamptz not null default now()
);
create index reclog_request_idx on recommendation_logs(walk_request_id);
alter table recommendation_logs enable row level security;
create policy reclog_read on recommendation_logs for select using (
  exists (select 1 from walk_requests w where w.id = walk_request_id and w.tutor_id = auth.uid()));
-- inserts/updates via service role only.
```

- [ ] **Step 2: Apply + regen types + commit.** `git commit -am "feat: recommendation_logs schema (RF25)"`

---

### Task 6: Adapter + wire into request flow — RF24, RF25

**Files:**
- Create: `lib/recommender/adapter.ts`, `lib/recommender/index.ts`; modify `app/(app)/walks/[id]/page.tsx`, `app/(app)/walks/new/page.tsx`

**Interfaces:**
- Consumes: `rankWalkers`, `createServerClient`, `createAdminClient`.
- Produces:
  - `loadCandidates(region: string): Promise<Candidate[]>`
  - `recommendForRequest(requestId: string): Promise<RankedWalker[]>` (loads request + candidates, ranks, logs)
  - `markChosen(requestId, walkerId)` (flips `chosen`)
  - re-exports so `import { recommendForRequest } from "@/lib/recommender"` works.

- [ ] **Step 1: `lib/recommender/adapter.ts`**

```ts
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rankWalkers } from "./rank";
import type { Candidate, RankInput, RankedWalker } from "./types";

export async function loadCandidates(region: string): Promise<Candidate[]> {
  const sb = await createServerClient();
  // avgRating stays null here (neutral prior); SP4 adds the walker_ratings join.
  const { data } = await sb.from("walker_profiles")
    .select("id, service_region, experience_years, base_price, active, accepted_sizes, accepted_behaviors, availability(weekday,start_time,end_time)")
    .ilike("service_region", region);
  return (data ?? []).map((w: any) => ({
    walkerId: w.id, region, serviceRegion: w.service_region ?? "",
    slots: w.availability ?? [], acceptsSizes: w.accepted_sizes ?? ["PEQUENO","MEDIO","GRANDE"],
    acceptsBehaviors: w.accepted_behaviors ?? [], experienceYears: w.experience_years ?? 0,
    basePrice: Number(w.base_price ?? 0), avgRating: null, active: w.active,
  }));
}

export async function recommendForRequest(requestId: string): Promise<RankedWalker[]> {
  const sb = await createServerClient();
  const { data: r } = await sb.from("walk_requests")
    .select("region, scheduled_date, start_time, pet:pets(size, behavior), price_estimate").eq("id", requestId).single();
  if (!r) return [];
  const weekday = new Date(r.scheduled_date + "T00:00:00").getDay();
  const input: RankInput = {
    requestId, region: r.region, weekday, startTime: r.start_time,
    petSize: (r as any).pet.size, petBehavior: (r as any).pet.behavior ?? "",
    expectedPrice: Number(r.price_estimate ?? 0), candidates: await loadCandidates(r.region),
  };
  const ranked = rankWalkers(input);
  const admin = createAdminClient();
  await admin.from("recommendation_logs").delete().eq("walk_request_id", requestId);
  if (ranked.length) await admin.from("recommendation_logs").insert(
    ranked.map((w, i) => ({ walk_request_id: requestId, walker_id: w.walkerId, score: w.score, rank: i + 1, factors: w.reasons })));
  return ranked;
}

export async function markChosen(requestId: string, walkerId: string) {
  await createAdminClient().from("recommendation_logs").update({ chosen: true })
    .eq("walk_request_id", requestId).eq("walker_id", walkerId);
}
```

- [ ] **Step 2: `lib/recommender/index.ts`** — replace the stub:

```ts
export * from "./types";
export { rankWalkers } from "./rank";
export { recommendForRequest, loadCandidates, markChosen } from "./adapter";
```

- [ ] **Step 3: Wire UI** — in `walks/[id]/page.tsx`, when the request has no walker, call `recommendForRequest(id)` and render the ranked list with each walker's `reasons` (pt-BR labels) and an "Escolher" button that calls `chooseWalker` then `markChosen`. Recompute (RF24): the detail page recomputes on load, so editing region/date/time/pet and returning yields a fresh ranking + fresh logs.
- [ ] **Step 4: Manual smoke + commit.** `git commit -am "feat: recommender adapter + wired into request flow (RF24, RF25)"`

---

### Task 7: Walker opportunities — RF27

**Files:**
- Create: `lib/recommender/opportunities.ts`, `lib/recommender/opportunities.test.ts`, `app/(app)/walker/opportunities/page.tsx`

**Interfaces:**
- Produces: `rankOpportunities(input: { walker: Candidate; requests: OpenRequest[] }): { requestId: string; score: number; reasons: Explanation[] }[]` where `OpenRequest = { id; region; weekday; startTime; petSize; petBehavior; expectedPrice }`.

- [ ] **Step 1: Failing test** — a walker in "Centro" available Mon 08–12 ranks a Mon-09:00 Centro GRANDE request above a Norte request (which is filtered out).

```ts
import { expect, test } from "vitest";
import { rankOpportunities } from "@/lib/recommender/opportunities";
import type { Candidate } from "@/lib/recommender/types";
const walker: Candidate = { walkerId:"w1", region:"Centro", serviceRegion:"Centro",
  slots:[{weekday:1,start_time:"08:00",end_time:"12:00"}], acceptsSizes:["GRANDE"],
  acceptsBehaviors:["calmo"], experienceYears:3, basePrice:20, avgRating:4, active:true };
test("filters non-matching region, ranks matching (RF27)", () => {
  const r = rankOpportunities({ walker, requests: [
    { id:"ok", region:"Centro", weekday:1, startTime:"09:00", petSize:"GRANDE", petBehavior:"calmo", expectedPrice:20 },
    { id:"no", region:"Norte", weekday:1, startTime:"09:00", petSize:"GRANDE", petBehavior:"calmo", expectedPrice:20 },
  ]});
  expect(r.map(x=>x.requestId)).toEqual(["ok"]);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `opportunities.ts`** — for each request, build a single-candidate `RankInput` (the walker) and reuse `rankWalkers`; keep requests where the walker is eligible; map score/reasons back to `requestId`.

```ts
import type { Candidate, Explanation, RankInput } from "./types";
import { rankWalkers } from "./rank";
export interface OpenRequest { id:string; region:string; weekday:number; startTime:string;
  petSize:"PEQUENO"|"MEDIO"|"GRANDE"; petBehavior:string; expectedPrice:number }
export function rankOpportunities(input: { walker: Candidate; requests: OpenRequest[] }) {
  const out: { requestId:string; score:number; reasons:Explanation[] }[] = [];
  for (const req of input.requests) {
    const ri: RankInput = { requestId:req.id, region:req.region, weekday:req.weekday,
      startTime:req.startTime, petSize:req.petSize, petBehavior:req.petBehavior,
      expectedPrice:req.expectedPrice, candidates:[input.walker] };
    const ranked = rankWalkers(ri);
    if (ranked.length) out.push({ requestId:req.id, score:ranked[0].score, reasons:ranked[0].reasons });
  }
  return out.sort((a,b) => b.score - a.score);
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: `walker/opportunities/page.tsx`** — loads open `solicitado` requests, builds the walker Candidate from own profile+slots, renders ranked opportunities with reasons. Commit.

```bash
git add -A && git commit -m "feat: walker opportunity recommendations (RF27)"
```

---

### Task 8: Enrichment interface (no-op default) — RF28

**Files:**
- Create: `lib/recommender/enrichment.ts`, `lib/recommender/enrichment.test.ts`

**Interfaces:**
- Produces: `interface RegionEnricher { enrich(region: string): Promise<RegionContext> }`; `noopEnricher`; `getEnricher()` returns noop unless `RECOMMENDER_ENRICH=on`.

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { noopEnricher } from "@/lib/recommender/enrichment";
test("noop enricher returns empty context", async () => {
  expect(await noopEnricher.enrich("Centro")).toEqual({ region: "Centro", signals: {} });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
export interface RegionContext { region: string; signals: Record<string, number> }
export interface RegionEnricher { enrich(region: string): Promise<RegionContext> }
export const noopEnricher: RegionEnricher = { async enrich(region) { return { region, signals: {} }; } };
export function getEnricher(): RegionEnricher {
  return process.env.RECOMMENDER_ENRICH === "on" ? noopEnricher /* swap for real provider */ : noopEnricher;
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: pluggable open-data enrichment, off by default (RF28)"`

---

### Task 9: E2E + docs

**Files:**
- Create: `e2e/recommender.spec.ts`; create `docs/recommender.md`; update `docs/architecture.md`, `docs/data-model.md`, `docs/endpoints.md`, `docs/progress/2026-07-01-sp3.md`, `README.md`

- [ ] **Step 1: `e2e/recommender.spec.ts`** — seed a tutor + pet + two walkers (one compatible, one out-of-region/time); CT-INT-03/04 (ranked list shown), CT-INT-05/CT-USU-07 (justification text visible), CT-USU-06 (order by compatibility), CT-IA-07 (edit request time → list changes).
- [ ] **Step 2: Run `npm run e2e` → PASS.**
- [ ] **Step 3: `docs/recommender.md`** — criteria, weights table, scoring formulas, explanation format, how to tune weights (RNF16/17 transparency). Update architecture/data-model/endpoints, `docs/progress/2026-07-01-sp3.md`, README. Commit.

```bash
git add -A && git commit -m "test+docs: SP3 e2e CT-* coverage + recommender docs (RNF16, RNF17)"
```

---

## Self-Review

**Spec coverage:** RF21 (T4), RF22 (T3), RF23 (T4), RF24 (T6 recompute), RF25 (T5/T6), RF26 (T2), RF27 (T7), RF28 (T8); RNF16 (pure/deterministic T1-4), RNF17 (weights T1). Every SP3 spec section maps to a task.

**Placeholders:** enrichment "swap for real provider" is a documented extension point per RF28 ("when viable"), not a missing requirement — the shipped default (noop) is complete and tested. No other TBDs.

**Type consistency:** `Candidate`, `RankInput`, `RankedWalker`, `Explanation`, `Criterion`, `Weights` defined once in T1 and consumed unchanged in T2–T7. `rankWalkers(input, weights?)` signature identical across T4/T6/T7. `isAvailableAt` reused from SP2 `lib/walks/matching.ts`.
