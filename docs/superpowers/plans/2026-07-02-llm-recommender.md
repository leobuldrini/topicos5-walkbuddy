# LLM Recommender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use an OpenRouter LLM call to choose the best eligible walker for a walk request, while keeping local deterministic ranking as a safe fallback.

**Architecture:** The existing local recommender remains responsible for hard filters, scores, and explanations. A new focused `llm.ts` module builds the prompt, parses a JSON answer, validates that the selected walker is still eligible, and maps it back into the existing `RankedWalker` shape. The Supabase adapter calls the LLM reranker after local ranking and falls back to local ordering whenever the API is unavailable or invalid.

**Tech Stack:** Next.js server-side TypeScript, Supabase adapter, Vitest, OpenRouter Chat Completions over `fetch`.

---

### Task 1: LLM response parsing and fallback-safe reranking

**Files:**
- Create: `lib/recommender/llm.ts`
- Create: `lib/recommender/llm.test.ts`
- Modify: `lib/recommender/index.ts`

- [ ] **Step 1: Write failing tests** for extracting JSON, putting the selected walker first, and falling back on invalid walker IDs.
- [ ] **Step 2: Run `npm run test -- lib/recommender/llm.test.ts` and verify failure.**
- [ ] **Step 3: Implement `llm.ts` with prompt building, JSON parsing, environment config, OpenRouter request, and fallback behavior.**
- [ ] **Step 4: Export the helper from `lib/recommender/index.ts`.**
- [ ] **Step 5: Run the targeted test and verify pass.**

### Task 2: Adapter wiring and documentation

**Files:**
- Modify: `lib/recommender/adapter.ts`
- Modify: `.env.example`
- Modify: `docs/recommender.md`
- Modify: `README.md`

- [ ] **Step 1: Add a failing adapter test only if the adapter has existing isolated coverage; otherwise cover behavior through `llm.test.ts` and keep the IO adapter thin.**
- [ ] **Step 2: Call `rerankWithLlm` from `recommendForRequest` after local ranking and before writing logs.**
- [ ] **Step 3: Document `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `OPENROUTER_BASE_URL`.**
- [ ] **Step 4: Run `npm run test`, `npm run typecheck`, and `npm run lint`.**

### Self-Review

Spec coverage: the plan replaces the previous local-only best-walker selection with an LLM-backed choice, while preserving hard filters and safe fallback.

Placeholder scan: no placeholders remain; the implementation boundaries and verification commands are explicit.

Type consistency: the new helper consumes and returns the existing `RankedWalker[]`, so the UI and logging code do not need new types.
