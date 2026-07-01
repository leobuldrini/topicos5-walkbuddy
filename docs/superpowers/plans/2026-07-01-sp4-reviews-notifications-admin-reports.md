# Walk Buddy SP4 (Reviews, Notifications, Admin, Reports) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the loop — mutual reviews + avg rating, in-app notifications, an admin area, and user reports.

**Architecture:** Extends SP0–SP3. Reviews feed the recommender's rating criterion via a `walker_ratings` SQL view. Notifications are in-app rows written by a `notify()` helper wired into SP2 transitions. Admin is a role-gated section.

**Tech Stack:** Same as prior SPs.

## Global Constraints

- Self-hosted, RLS on all tables, pt-BR copy, action logging, <3s, commit per task.
- Admin strictly gated by `profiles.is_admin` (server-checked). (RNF13)

---

### Task 1: Migration — reviews, notifications, reports, is_admin, ratings view

**Files:**
- Create: `supabase/migrations/0005_social_admin.sql`; regenerate types.

- [ ] **Step 1: Migration**

```sql
alter table profiles add column is_admin boolean not null default false;

create type review_target as enum ('walker','tutor','pet');
create type report_status as enum ('aberta','em_analise','resolvida');

create table reviews (
  id uuid primary key default gen_random_uuid(),
  walk_request_id uuid not null references walk_requests(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  target_type review_target not null,
  target_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (walk_request_id, author_id, target_type)
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_user_id uuid not null references profiles(id) on delete cascade,
  walk_request_id uuid references walk_requests(id) on delete set null,
  reason text not null,
  status report_status not null default 'aberta',
  created_at timestamptz not null default now()
);
create view walker_ratings as
  select target_id as walker_id, round(avg(rating)::numeric, 2) as avg_rating, count(*) as review_count
  from reviews where target_type = 'walker' group by target_id;

alter table reviews enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

create policy reviews_read_involved on reviews for select using (
  author_id = auth.uid()
  or (target_type='walker' and target_id = auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy reviews_write_own on reviews for insert with check (author_id = auth.uid());

create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_update_own on notifications for update using (user_id = auth.uid());

create policy reports_insert_any on reports for insert with check (reporter_id = auth.uid());
create policy reports_read_reporter_or_admin on reports for select using (
  reporter_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
```

- [ ] **Step 2: Apply + regen types + commit.** `git commit -am "feat: reviews/notifications/reports/is_admin + ratings view (RF12-14,17-19)"`

---

### Task 2: Reviews + avg rating — RF12, RF13, RF14

**Files:**
- Create: `lib/validation/review.ts`, `lib/validation/review.test.ts`, `app/(app)/actions/reviews.ts`, `components/ReviewForm.tsx`; modify `app/(app)/walks/[id]/page.tsx`, `app/(app)/walkers/page.tsx`, `lib/recommender/adapter.ts`

**Interfaces:**
- Produces: `submitReview(fd)` server action; walker avg rating read from `walker_ratings`.

- [ ] **Step 1: Failing test `lib/validation/review.test.ts`**

```ts
import { expect, test } from "vitest";
import { reviewSchema } from "@/lib/validation/review";
test("rating within 1..5", () => {
  expect(reviewSchema.safeParse({ walkRequestId:"w", targetType:"walker", targetId:"t", rating:0 }).success).toBe(false);
  expect(reviewSchema.safeParse({ walkRequestId:"w", targetType:"walker", targetId:"t", rating:5 }).success).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/validation/review.ts`**

```ts
import { z } from "zod";
export const reviewSchema = z.object({
  walkRequestId: z.string().min(1),
  targetType: z.enum(["walker", "tutor", "pet"]),
  targetId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Nota mínima 1").max(5, "Nota máxima 5"),
  comment: z.string().optional(),
});
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/actions/reviews.ts`** — `submitReview` validates, enforces the walk is `concluido`, inserts (unique constraint prevents duplicates → friendly pt-BR error on conflict), calls `logAction`.

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/log";
import { reviewSchema } from "@/lib/validation/review";

export async function submitReview(fd: FormData) {
  const user = await requireUser();
  const p = reviewSchema.safeParse({
    walkRequestId: fd.get("walkRequestId"), targetType: fd.get("targetType"),
    targetId: fd.get("targetId"), rating: fd.get("rating"), comment: fd.get("comment") || undefined,
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { data: walk } = await sb.from("walk_requests").select("status").eq("id", p.data.walkRequestId).single();
  if (walk?.status !== "concluido") return { error: "Só é possível avaliar passeios concluídos" };
  const { error } = await sb.from("reviews").insert({
    walk_request_id: p.data.walkRequestId, author_id: user.id, target_type: p.data.targetType,
    target_id: p.data.targetId, rating: p.data.rating, comment: p.data.comment ?? null });
  if (error) return { error: "Você já avaliou este passeio" };
  await logAction({ actorId: user.id, action: "review.create", entity: "reviews", entityId: p.data.walkRequestId });
  revalidatePath("/walks"); return { ok: true };
}
```

- [ ] **Step 6: UI + recommender wiring** — `ReviewForm` shown on a `concluido` walk for the side that hasn't reviewed (tutor→walker; walker→tutor/pet). `walkers/page.tsx` and walker profile read `walker_ratings.avg_rating`. In `lib/recommender/adapter.ts loadCandidates`, join `walker_ratings` and set `avgRating` (replacing the SP3 `null` prior so real ratings drive scoring — satisfies CT-INT-10).
- [ ] **Step 7: Manual smoke + commit.** `git commit -am "feat: mutual reviews + avg rating feeding recommender (RF12-14)"`

---

### Task 3: Notifications — RF17

**Files:**
- Create: `lib/notify.ts`, `lib/notify.test.ts`, `app/(app)/actions/notifications.ts`, `components/NotificationBell.tsx`, `app/(app)/notifications/page.tsx`; modify `app/(app)/actions/walks.ts`

**Interfaces:**
- Produces: `notify(userId, type, payload)`; `markRead(id)`; bell with unread count.

- [ ] **Step 1: Failing test `lib/notify.test.ts`**

```ts
import { expect, test } from "vitest";
import { buildNotification } from "@/lib/notify";
test("builds a notification row", () => {
  expect(buildNotification("u1", "walk.accepted", { id: "w1" }))
    .toMatchObject({ user_id: "u1", type: "walk.accepted", payload: { id: "w1" }, read: false });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/notify.ts`**

```ts
import { createAdminClient } from "@/lib/supabase/admin";
export function buildNotification(userId: string, type: string, payload: Record<string, unknown>) {
  return { user_id: userId, type, payload, read: false };
}
export async function notify(userId: string, type: string, payload: Record<string, unknown>) {
  await createAdminClient().from("notifications").insert(buildNotification(userId, type, payload));
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Wire into `walks.ts transition()`** — after each successful transition, `notify` the counterpart: accept → notify tutor; cancel → notify the other party; start/complete → notify tutor. Load `tutor_id`/`walker_id` in the transition's initial select and call `notify` accordingly.
- [ ] **Step 6: UI** — `NotificationBell` (unread count, in `(app)/layout.tsx` Nav) + `notifications/page.tsx` (list, mark-as-read via `markRead`). Commit.

```bash
git add -A && git commit -m "feat: in-app notifications wired to walk lifecycle (RF17)"
```

---

### Task 4: Reports / denúncias — RF19

**Files:**
- Create: `lib/validation/report.ts`, `lib/validation/report.test.ts`, `app/(app)/actions/reports.ts`, `components/ReportForm.tsx`; modify `app/(app)/walks/[id]/page.tsx`

**Interfaces:**
- Produces: `submitReport(fd)` server action.

- [ ] **Step 1: Failing test**

```ts
import { expect, test } from "vitest";
import { reportSchema } from "@/lib/validation/report";
test("requires reason and reported user", () => {
  expect(reportSchema.safeParse({ reportedUserId:"", reason:"x" }).success).toBe(false);
  expect(reportSchema.safeParse({ reportedUserId:"u2", reason:"Comportamento inadequado" }).success).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/validation/report.ts`**

```ts
import { z } from "zod";
export const reportSchema = z.object({
  reportedUserId: z.string().min(1, "Usuário inválido"),
  walkRequestId: z.string().optional(),
  reason: z.string().min(3, "Descreva o motivo"),
});
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/actions/reports.ts`** — `submitReport` validates, inserts a `reports` row (`aberta`), `logAction`. Follows the reviews-action pattern.
- [ ] **Step 6: UI** — `ReportForm` reachable from a walk detail against the counterpart. Commit.

```bash
git add -A && git commit -m "feat: user reports / denúncias (RF19)"
```

---

### Task 5: Admin area — RF18

**Files:**
- Create: `lib/admin.ts`, `app/(app)/admin/layout.tsx`, `app/(app)/admin/page.tsx`, `app/(app)/admin/users/page.tsx`, `app/(app)/admin/walks/page.tsx`, `app/(app)/admin/reviews/page.tsx`, `app/(app)/admin/reports/page.tsx`, `app/(app)/actions/admin.ts`

**Interfaces:**
- Produces: `requireAdmin(): Promise<void>` (redirect if not admin); `setReportStatus(id, status)`.

- [ ] **Step 1: `lib/admin.ts`**

```ts
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
export async function requireAdmin() {
  const u = await requireUser();
  const sb = await createServerClient();
  const { data } = await sb.from("profiles").select("is_admin").eq("id", u.id).single();
  if (!data?.is_admin) redirect("/dashboard");
}
```

- [ ] **Step 2: `admin/layout.tsx`** calls `requireAdmin()`; tabs Users/Walks/Reviews/Reports. Each page reads via `createAdminClient` (service role, since admin needs cross-user visibility) after the `requireAdmin` gate.
- [ ] **Step 3: `actions/admin.ts`** — `setReportStatus(id, status)` (guarded by `requireAdmin`) updates report status aberta→em_analise→resolvida + `logAction`.
- [ ] **Step 4: Manual smoke** — non-admin visiting `/admin` → redirected to `/dashboard`; admin sees tables. Commit.

```bash
git add -A && git commit -m "feat: role-gated admin area with report moderation (RF18)"
```

---

### Task 6: E2E + docs + admin bootstrap

**Files:**
- Create: `e2e/social-admin.spec.ts`; update `docs/data-model.md`, `docs/endpoints.md`, `docs/progress/2026-07-01-sp4.md`, `README.md`, `docs/architecture.md`

- [ ] **Step 1: `e2e/social-admin.spec.ts`** — CT-USU-10 (review after completed walk), CT-INT-10 (review saved → recommender avg rating reflects it: assert a reviewed walker outranks an unreviewed equal one), notification appears after accept, report submission, admin gate blocks non-admin (extends CT-NF-03).
- [ ] **Step 2: Run `npm run e2e` → PASS.**
- [ ] **Step 3: Admin bootstrap doc** — README section: promote first admin via
  `update profiles set is_admin = true where id = '<uuid>';` (Studio or `supabase db` SQL).
- [ ] **Step 4: Final docs pass** — data-model (new tables + view), endpoints (review/notify/report/admin actions), `docs/progress/2026-07-01-sp4.md`, architecture final map. Commit.

```bash
git add -A && git commit -m "test+docs: SP4 e2e CT-* coverage + final docs + admin bootstrap"
```

---

## Self-Review

**Spec coverage:** RF12 (T2), RF13 (T2), RF14 (T2 view), RF17 (T3), RF18 (T5), RF19 (T4). RNF06 logging in each action; RNF13 admin gate T5 + RLS T1. CT-INT-10 (review → recommender) covered by T2 adapter wiring + T6 e2e.

**Placeholders:** none. Admin pages use service role after an explicit `requireAdmin` gate — intentional and stated.

**Type consistency:** `submitReview`/`submitReport`/`setReportStatus`/`notify`/`requireAdmin` signatures consistent between definition and callers. `walker_ratings.avg_rating` consumed by `loadCandidates` matches the SP3 `Candidate.avgRating: number | null` field. `report_status` enum values (aberta/em_analise/resolvida) consistent across migration, action, and admin UI.
