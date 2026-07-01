# Walk Buddy — SP3 (Recommender Module) Design

Date: 2026-07-01
Status: Approved (design), pending implementation plan
Scope: RF21–RF28; RNF16, RNF17. The AI differentiator. Builds on SP0–SP2.

## 1. Context

Third build cycle. Implements the explainable recommender that replaces the SP2 stub.
It is a **pure, isolated TypeScript module** (`lib/recommender/`) with a well-defined
interface: given a walk request and candidate walkers, it filters, scores, ranks, and
explains. No ML, no training — a weighted multicriteria model, per the architecture and
test plan (viable within the deadline, explainable, evolvable).

## 2. Goals & non-goals

**Goals**
- Ranked list of recommended walkers per walk request (RF21).
- Score uses at least: location, availability, pet size, pet behavior, walker
  experience, price range, ratings history (RF22).
- Per-recommendation explanation of the main justifying criteria (RF23).
- Recompute when relevant request fields change (RF24).
- Log interactions with recommendations for future evolution (RF25).
- Never recommend walkers unavailable at the requested time or incompatible with the
  pet (RF26) — hard filters before scoring.
- Walker-side: recommend compatible open opportunities to a walker (RF27).
- Optional external open-data enrichment when viable (RF28), behind a pluggable
  interface, off by default.
- Consistent + explainable output (RNF16); evolvable weights/config without app
  restructuring (RNF17).

**Non-goals**
- Deep learning / model training / large historical datasets.
- Real-time personalization. Learning layer is only *prepared* via interaction logs.

## 3. Module architecture

`lib/recommender/` — pure functions, no DB/IO inside the core:

```
types.ts          RankInput, Candidate, RankedWalker, Explanation, Weights
filters.ts        hard filters (availability, region, pet compatibility) — RF26
scoring.ts        per-criterion scorers → normalized [0,1]
weights.ts        default weights + loader (config-driven) — RNF17
rank.ts           filter → score → weight → sort → attach explanation
opportunities.ts  reverse ranking: open requests for a walker — RF27
enrichment.ts     optional open-data enricher interface (no-op default) — RF28
index.ts          recommendWalkers(input), recommendOpportunities(input)
```

Data access (loading candidates, writing logs) lives in a thin adapter
`lib/recommender/adapter.ts` that the app calls; the core stays pure and unit-testable
with hand-built fixtures (as the test plan's manual scenarios require).

## 4. Algorithm

1. **Hard filters (RF26):** drop walkers who are inactive, out of region, without an
   availability slot covering the requested weekday/time, or whose profile excludes the
   pet's size/behavior. Filtered-out reasons are recorded (for "no results" messaging,
   CT-IA-08).
2. **Per-criterion scores** in [0,1]:
   - region match (exact/partial)
   - availability fit (slot coverage / margin)
   - pet size compatibility
   - pet behavior compatibility
   - experience (normalized years)
   - price fit (closeness to tutor's expected/base range)
   - ratings (normalized avg rating; neutral prior when no reviews yet)
3. **Weighted sum** with configurable `weights` (RNF17). `score = Σ wᵢ·sᵢ`.
4. **Rank** descending (RF21). Ties broken by ratings, then experience (CT-IA-05).
5. **Explanation (RF23):** top-N contributing `criterion → contribution` pairs per
   walker, rendered as human-readable pt-BR reasons ("Atende sua região",
   "Disponível no horário", "Boa avaliação").

Determinism → same input yields same ranking (RNF16), unit-testable.

## 5. Recompute (RF24)

Recommendations are computed on demand from current request state. When the tutor edits
region/date/time/pet, the request-create/detail page recomputes by re-invoking
`recommendWalkers`. No stored ranking to invalidate; a fresh interaction log row is
written per computation shown.

## 6. Interaction logging (RF25)

- **recommendation_logs** — `id` uuid PK, `walk_request_id` FK, `walker_id` FK,
  `score` numeric, `rank` int, `factors` jsonb (per-criterion contributions),
  `shown_at` timestamptz, `chosen` bool default false, `created_at`.
- Written when a ranking is shown; `chosen` flipped when the tutor selects that walker.
  This is the substrate for future supervised/RL evolution (RNF17), no learning now.

## 7. Walker opportunities (RF27)

`recommendOpportunities(walkerId)` reverses the model: over open `solicitado` requests,
apply the same hard filters from the walker's perspective (region, availability, pet
compatibility) and rank by fit. Surfaced on the walker dashboard.

## 8. Open-data enrichment (RF28)

`enrichment.ts` defines `RegionEnricher { enrich(region): RegionContext }`. Default is a
no-op. An optional provider may pull public territorial/leisure data to nudge scores or
show context. Behind a feature flag, off by default so the MVP never depends on an
external service (aligns with RF28 "when viable").

## 9. Testing (maps to test plan)

- **Vitest** with hand-built fixtures (the plan's manual scenarios):
  - CT-IA-01 lists only available walkers
  - CT-IA-02 excludes unavailable walker
  - CT-IA-03 prioritizes walkers accepting large pets
  - CT-IA-04 prioritizes region match
  - CT-IA-05 higher rating wins when else equal
  - CT-IA-06 explanation contains the driving criteria
  - CT-IA-07 recompute changes the list after input change
  - CT-IA-08 no compatible walkers → empty + reason
- **Playwright** — CT-INT-03 recommender invoked, CT-INT-04 ranked list shown,
  CT-INT-05 justification shown, CT-USU-06 list ordered by compatibility,
  CT-USU-07 user understands the justification.

## 10. Docs deliverables

`docs/architecture.md` recommender section (module map, data flow),
`docs/data-model.md` recommendation_logs, `docs/endpoints.md` recommend actions,
`docs/recommender.md` (weights, criteria, explanation format — for RNF16/17 transparency),
`docs/progress/` entries, README update.

## 11. Phases

1. Migration: recommendation_logs + RLS; types.
2. `types.ts`, `weights.ts`, `filters.ts` + unit tests (CT-IA-01..04, 08).
3. `scoring.ts`, `rank.ts`, explanation + unit tests (CT-IA-05, 06).
4. Adapter: load candidates, write logs; wire into request-create/detail (replace stub).
5. Recompute on edit (RF24) + CT-IA-07.
6. Walker opportunities (RF27).
7. Enrichment interface + no-op default + flag (RF28).
8. Playwright integration tests (CT-INT-03..05, CT-USU-06/07); docs pass.

## 12. Acceptance

Given a walk request, the system returns a ranked, explained list of only compatible
walkers; illegal candidates are filtered; editing the request recomputes the list;
selections and displays are logged; walkers see ranked opportunities; enrichment is
pluggable and off by default; listed CT-IA/CT-INT/CT-USU tests green; docs current.
