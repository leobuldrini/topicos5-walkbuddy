# Walk Buddy SP2 (Walk Requests & Lifecycle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the core transactional loop — request a walk, accept/reject, run the status machine, price + simulated payment, history, earnings.

**Architecture:** Extends SP0+SP1. Pure domain modules (`lib/walks/statusMachine.ts`, `lib/walks/price.ts`) hold the rules and are unit-tested in isolation; Next.js server actions drive persistence + logging; the recommender is still the SP0 stub, so the tutor picks a walker from a region-filtered list.

**Tech Stack:** Same as SP0+SP1.

## Global Constraints

- Self-hosted, RLS on all tables, pt-BR copy, action logging on every transition, <3s, commit per task. (RNF02, RNF03, RNF06, RNF11, RNF13, RNF14, RNF18)
- Status transitions happen server-side only, validated by `lib/walks/statusMachine.ts`.

---

### Task 1: Migration — walk_requests + payments

**Files:**
- Create: `supabase/migrations/0003_walks.sql`; regenerate `lib/database.types.ts`

**Interfaces:**
- Produces: enums `walk_status`, `payment_status`; tables `walk_requests`, `payments`; RLS.

- [ ] **Step 1: `supabase/migrations/0003_walks.sql`**

```sql
create type walk_status as enum ('solicitado','aceito','em_andamento','concluido','cancelado');
create type payment_status as enum ('pendente','pago');

create table walk_requests (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete restrict,
  walker_id uuid references walker_profiles(id) on delete set null,
  region text not null,
  scheduled_date date not null,
  start_time time not null,
  duration_min int not null check (duration_min > 0),
  location_text text,
  status walk_status not null default 'solicitado',
  price_estimate numeric not null default 0,
  cancel_reason text,
  cancelled_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  walk_request_id uuid not null unique references walk_requests(id) on delete cascade,
  amount numeric not null,
  status payment_status not null default 'pendente',
  method text not null default 'simulado',
  created_at timestamptz not null default now()
);
create index walk_walker_idx on walk_requests(walker_id);
create index walk_tutor_idx on walk_requests(tutor_id);
create index walk_region_date_idx on walk_requests(region, scheduled_date);
create index walk_status_idx on walk_requests(status);

alter table walk_requests enable row level security;
alter table payments enable row level security;

create policy walk_tutor_all on walk_requests for all
  using (auth.uid() = tutor_id) with check (auth.uid() = tutor_id);
create policy walk_walker_read on walk_requests for select
  using (walker_id = auth.uid() or (walker_id is null and status = 'solicitado'));
create policy pay_read on payments for select using (
  exists (select 1 from walk_requests w where w.id = walk_request_id
    and (w.tutor_id = auth.uid() or w.walker_id = auth.uid())));
-- writes to walk_requests by walker + payments happen via service role (server actions).
```

- [ ] **Step 2: Apply + regenerate types.** `npx supabase db reset && npx supabase gen types typescript --local > lib/database.types.ts`

- [ ] **Step 3: Commit.** `git add -A && git commit -m "feat: walk_requests + payments schema + RLS (RF06, RF09, RF16)"`

---

### Task 2: Status machine (pure) — RF09, RF10, RF08

**Files:**
- Create: `lib/walks/statusMachine.ts`, `lib/walks/statusMachine.test.ts`

**Interfaces:**
- Produces:
  - `type WalkStatus = 'solicitado'|'aceito'|'em_andamento'|'concluido'|'cancelado'`
  - `type WalkAction = 'accept'|'reject'|'start'|'complete'|'cancel'`
  - `canTransition(from: WalkStatus, action: WalkAction): boolean`
  - `nextStatus(from: WalkStatus, action: WalkAction): WalkStatus` (throws on illegal)

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { canTransition, nextStatus } from "@/lib/walks/statusMachine";
test("accept moves solicitado -> aceito", () => {
  expect(nextStatus("solicitado", "accept")).toBe("aceito");
});
test("cannot start a solicitado walk", () => {
  expect(canTransition("solicitado", "start")).toBe(false);
  expect(() => nextStatus("solicitado", "start")).toThrow();
});
test("cancel allowed before start only", () => {
  expect(canTransition("aceito", "cancel")).toBe(true);
  expect(canTransition("em_andamento", "cancel")).toBe(false);
});
test("reject keeps solicitado", () => {
  expect(nextStatus("solicitado", "reject")).toBe("solicitado");
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
export type WalkStatus = "solicitado" | "aceito" | "em_andamento" | "concluido" | "cancelado";
export type WalkAction = "accept" | "reject" | "start" | "complete" | "cancel";

const TABLE: Record<WalkAction, { from: WalkStatus[]; to: (f: WalkStatus) => WalkStatus }> = {
  accept:   { from: ["solicitado"], to: () => "aceito" },
  reject:   { from: ["solicitado"], to: () => "solicitado" },
  start:    { from: ["aceito"], to: () => "em_andamento" },
  complete: { from: ["em_andamento"], to: () => "concluido" },
  cancel:   { from: ["solicitado", "aceito"], to: () => "cancelado" },
};
export function canTransition(from: WalkStatus, action: WalkAction): boolean {
  return TABLE[action].from.includes(from);
}
export function nextStatus(from: WalkStatus, action: WalkAction): WalkStatus {
  if (!canTransition(from, action)) throw new Error(`Transição inválida: ${from} -> ${action}`);
  return TABLE[action].to(from);
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: walk status machine (RF08, RF09, RF10)"`

---

### Task 3: Price estimate (pure) — RF15

**Files:**
- Create: `lib/walks/price.ts`, `lib/walks/price.test.ts`

**Interfaces:**
- Produces: `estimatePrice(input: { basePrice: number; durationMin: number; size: 'PEQUENO'|'MEDIO'|'GRANDE' }): number` (2-decimal rounded).

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { estimatePrice } from "@/lib/walks/price";
test("scales with duration and size", () => {
  expect(estimatePrice({ basePrice: 20, durationMin: 60, size: "PEQUENO" })).toBe(20);
  expect(estimatePrice({ basePrice: 20, durationMin: 60, size: "GRANDE" })).toBe(26);
  expect(estimatePrice({ basePrice: 20, durationMin: 30, size: "MEDIO" })).toBe(11.5);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
const SIZE_MULT = { PEQUENO: 1.0, MEDIO: 1.15, GRANDE: 1.3 } as const;
export function estimatePrice(i: { basePrice: number; durationMin: number; size: keyof typeof SIZE_MULT }): number {
  const raw = i.basePrice * (i.durationMin / 60) * SIZE_MULT[i.size];
  return Math.round(raw * 100) / 100;
}
```

- [ ] **Step 4: Run → PASS. Commit.** `git commit -am "feat: walk price estimate (RF15)"`

---

### Task 4: Compatible-walkers query + browse — RF05, RF07

**Files:**
- Create: `lib/walks/matching.ts`, `lib/walks/matching.test.ts`, `app/(app)/walkers/page.tsx`

**Interfaces:**
- Consumes: `availability`, `walker_profiles`.
- Produces:
  - `isAvailableAt(slots: {weekday:number;start_time:string;end_time:string}[], weekday: number, time: string): boolean`
  - `walker browse page` filtered by region.

- [ ] **Step 1: Failing test `lib/walks/matching.test.ts`**

```ts
import { expect, test } from "vitest";
import { isAvailableAt } from "@/lib/walks/matching";
const slots = [{ weekday: 1, start_time: "08:00", end_time: "12:00" }];
test("inside slot is available", () => { expect(isAvailableAt(slots, 1, "09:00")).toBe(true); });
test("outside slot not available", () => { expect(isAvailableAt(slots, 1, "13:00")).toBe(false); });
test("wrong weekday not available", () => { expect(isAvailableAt(slots, 2, "09:00")).toBe(false); });
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `lib/walks/matching.ts`**

```ts
export function isAvailableAt(
  slots: { weekday: number; start_time: string; end_time: string }[],
  weekday: number, time: string,
): boolean {
  return slots.some((s) => s.weekday === weekday && s.start_time <= time && time < s.end_time);
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/walkers/page.tsx`** — tutor view, optional `?region=` filter; lists active walkers whose `service_region` matches (ILIKE), showing price, experience, region. Each links to "Solicitar passeio" (Task 5). Uses `createServerClient`. Commit.

```bash
git add -A && git commit -m "feat: availability matching + walker browse (RF05, RF07)"
```

---

### Task 5: Create walk request — RF06, RF15

**Files:**
- Create: `lib/validation/walk.ts`, `lib/validation/walk.test.ts`, `app/(app)/walks/new/page.tsx`, `app/(app)/actions/walks.ts`

**Interfaces:**
- Consumes: `estimatePrice`, `requireUser`, `logAction`, recommender stub (caught).
- Produces: `createWalkRequest(fd)` server action → inserts `solicitado`.

- [ ] **Step 1: Failing test `lib/validation/walk.test.ts`**

```ts
import { expect, test } from "vitest";
import { walkSchema } from "@/lib/validation/walk";
test("requires pet, date, time, duration, region", () => {
  expect(walkSchema.safeParse({ petId:"", region:"Centro", date:"2026-07-10", startTime:"09:00", durationMin:60 }).success).toBe(false);
  expect(walkSchema.safeParse({ petId:"p1", region:"Centro", date:"2026-07-10", startTime:"09:00", durationMin:60 }).success).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/validation/walk.ts`**

```ts
import { z } from "zod";
export const walkSchema = z.object({
  petId: z.string().uuid("Selecione um pet").or(z.string().min(1, "Selecione um pet")),
  region: z.string().min(1, "Informe a região"),
  date: z.string().min(1, "Informe a data"),
  startTime: z.string().min(1, "Informe o horário"),
  durationMin: z.coerce.number().int().positive("Duração inválida"),
  locationText: z.string().optional(),
  walkerId: z.string().optional(),
});
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/actions/walks.ts`** (create + lifecycle in one module)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/log";
import { walkSchema } from "@/lib/validation/walk";
import { estimatePrice } from "@/lib/walks/price";
import { nextStatus, type WalkAction } from "@/lib/walks/statusMachine";

export async function createWalkRequest(fd: FormData) {
  const user = await requireUser();
  const p = walkSchema.safeParse({
    petId: fd.get("petId"), region: fd.get("region"), date: fd.get("date"),
    startTime: fd.get("startTime"), durationMin: fd.get("durationMin"),
    locationText: fd.get("locationText") || undefined, walkerId: fd.get("walkerId") || undefined,
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { data: pet } = await sb.from("pets").select("size").eq("id", p.data.petId).single();
  let price = 0;
  if (p.data.walkerId && pet) {
    const { data: w } = await sb.from("walker_profiles").select("base_price").eq("id", p.data.walkerId).single();
    if (w) price = estimatePrice({ basePrice: Number(w.base_price), durationMin: p.data.durationMin, size: pet.size });
  }
  const { data, error } = await sb.from("walk_requests").insert({
    tutor_id: user.id, pet_id: p.data.petId, walker_id: p.data.walkerId ?? null,
    region: p.data.region, scheduled_date: p.data.date, start_time: p.data.startTime,
    duration_min: p.data.durationMin, location_text: p.data.locationText, price_estimate: price,
  }).select("id").single();
  if (error) return { error: "Não foi possível criar a solicitação" };
  await logAction({ actorId: user.id, action: "walk.create", entity: "walk_requests", entityId: data.id });
  revalidatePath("/walks"); return { ok: true, id: data.id };
}

async function transition(id: string, action: WalkAction, actorId: string, extra?: { reason?: string }) {
  const admin = createAdminClient();
  const { data: w } = await admin.from("walk_requests").select("status, walker_id, price_estimate").eq("id", id).single();
  if (!w) return { error: "Passeio não encontrado" };
  let to; try { to = nextStatus(w.status, action); } catch (e) { return { error: (e as Error).message }; }
  const patch: Record<string, unknown> = { status: to, updated_at: new Date().toISOString() };
  if (action === "reject") patch.walker_id = null;
  if (action === "cancel") { patch.cancel_reason = extra?.reason ?? ""; patch.cancelled_by = actorId; }
  await admin.from("walk_requests").update(patch).eq("id", id);
  if (action === "accept") await admin.from("payments").upsert({ walk_request_id: id, amount: w.price_estimate, status: "pendente" }, { onConflict: "walk_request_id" });
  if (action === "complete") await admin.from("payments").update({ status: "pago" }).eq("walk_request_id", id);
  await logAction({ actorId, action: `walk.${action}`, entity: "walk_requests", entityId: id });
  revalidatePath("/walks"); return { ok: true };
}

export async function acceptWalk(id: string) { const u = await requireUser(); return transition(id, "accept", u.id); }
export async function rejectWalk(id: string) { const u = await requireUser(); return transition(id, "reject", u.id); }
export async function startWalk(id: string) { const u = await requireUser(); return transition(id, "start", u.id); }
export async function completeWalk(id: string) { const u = await requireUser(); return transition(id, "complete", u.id); }
export async function cancelWalk(id: string, reason: string) { const u = await requireUser(); return transition(id, "cancel", u.id, { reason }); }
export async function chooseWalker(id: string, walkerId: string) {
  const u = await requireUser(); const sb = await createServerClient();
  await sb.from("walk_requests").update({ walker_id: walkerId }).eq("id", id).eq("tutor_id", u.id);
  await logAction({ actorId: u.id, action: "walk.choose_walker", entity: "walk_requests", entityId: id, metadata: { walkerId } });
  revalidatePath("/walks"); return { ok: true };
}
```

- [ ] **Step 6: `app/(app)/walks/new/page.tsx`** — form: pet select (own pets), region, date, time, duration, location; live price hint. Prefills `walkerId` when arriving from a walker's "Solicitar" link. Commit.

```bash
git add -A && git commit -m "feat: create walk request + lifecycle transitions (RF06, RF08-10, RF16)"
```

---

### Task 6: Tutor request detail + cancel + choose — RF10

**Files:**
- Create: `app/(app)/walks/[id]/page.tsx`, `components/CancelForm.tsx`

**Interfaces:**
- Consumes: `cancelWalk`, `chooseWalker`, walk read via RLS.

- [ ] **Step 1: Detail page** shows status badge, pet, walker, price, payment status; cancel button opens a reason field → `cancelWalk(id, reason)`; if no walker yet, a region-filtered walker list with "Escolher" → `chooseWalker`.
- [ ] **Step 2: Manual smoke: create → choose → cancel with reason.** Commit.

```bash
git add -A && git commit -m "feat: tutor walk detail, choose walker, cancel with reason (RF10)"
```

---

### Task 7: Walker inbox + progress controls — RF07, RF08

**Files:**
- Create: `app/(app)/walker/requests/page.tsx`

**Interfaces:**
- Consumes: `isAvailableAt`, `acceptWalk`, `rejectWalk`, `startWalk`, `completeWalk`.

- [ ] **Step 1: Inbox** — loads open `solicitado` requests in the walker's `service_region`, filtered in-app by `isAvailableAt` against the walker's slots; each row has Aceitar / Recusar. Accepted walks show Iniciar → Concluir.
- [ ] **Step 2: Manual smoke: accept → start → complete; reject detaches.** Commit.

```bash
git add -A && git commit -m "feat: walker request inbox + progress controls (RF07, RF08)"
```

---

### Task 8: History + earnings — RF11, RF20

**Files:**
- Create: `lib/walks/earnings.ts`, `lib/walks/earnings.test.ts`, `app/(app)/walks/page.tsx`, `app/(app)/walker/earnings/page.tsx`

**Interfaces:**
- Produces: `summarizeEarnings(walks: { status: string; price_estimate: number }[]): { completed: number; total: number }`.

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { summarizeEarnings } from "@/lib/walks/earnings";
test("sums only completed", () => {
  const r = summarizeEarnings([
    { status: "concluido", price_estimate: 30 },
    { status: "concluido", price_estimate: 20 },
    { status: "cancelado", price_estimate: 99 },
  ]);
  expect(r).toEqual({ completed: 2, total: 50 });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
export function summarizeEarnings(walks: { status: string; price_estimate: number }[]) {
  const done = walks.filter((w) => w.status === "concluido");
  return { completed: done.length, total: done.reduce((s, w) => s + Number(w.price_estimate), 0) };
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: `walks/page.tsx`** — history for the current user (tutor: own; walker: assigned), grouped by status. `walker/earnings/page.tsx` — uses `summarizeEarnings`. Commit.

```bash
git add -A && git commit -m "feat: walk history + walker earnings summary (RF11, RF20)"
```

---

### Task 9: E2E + docs

**Files:**
- Create: `e2e/walks.spec.ts`; update `docs/data-model.md`, `docs/endpoints.md`, `docs/progress/2026-07-01-sp2.md`, `README.md`

- [ ] **Step 1: `e2e/walks.spec.ts`** — CT-INT-01 (request created), CT-USU-05 (create request), CT-USU-08 (choose walker → request sent), CT-INT-06/CT-USU-09 (walker accepts → status aceito), CT-INT-07 (walker rejects → tutor can reselect), CT-INT-08 (submit without required field → clear error), CT-INT-09 (complete → appears in history), CT-NF-06 (persist after reload). Use signup helpers to create a tutor + a walker + a pet + availability.
- [ ] **Step 2: Run `npm run e2e` → PASS.**
- [ ] **Step 3: Docs** — data-model (walk_requests/payments + status diagram), endpoints (walk actions), `docs/progress/2026-07-01-sp2.md`, README update. Commit.

```bash
git add -A && git commit -m "test+docs: SP2 e2e CT-* coverage + docs"
```

---

## Self-Review

**Spec coverage:** RF05 (T4), RF06 (T5), RF07 (T4/T7), RF08 (T2/T7), RF09 (T2), RF10 (T2/T6), RF11 (T8), RF15 (T3), RF16 (T5 payments), RF20 (T8). RNF06 logging in T5 actions; RNF11 validation T5.

**Placeholders:** none in logic/schema/tests; UI steps thin and follow the SP0+SP1 established form/action pattern.

**Type consistency:** `WalkStatus`/`WalkAction` and `nextStatus` used identically in T2 and T5. `estimatePrice` signature matches T3↔T5. `summarizeEarnings` shape matches T8 test↔page. `isAvailableAt` matches T4↔T7.
