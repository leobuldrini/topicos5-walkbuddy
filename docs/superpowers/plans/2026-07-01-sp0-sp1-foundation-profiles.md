# Walk Buddy SP0+SP1 (Foundation + Profiles/Pets) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a self-hosted Next.js + Supabase stack with email/password auth, roles, pets CRUD, and walker profiles.

**Architecture:** Single TypeScript Next.js (App Router) app. Data + auth + storage from a self-hosted Supabase stack in Docker (Supabase CLI). SQL migrations are the single source of truth; TS types generated from schema. Domain logic in `lib/`, isolated recommender interface stubbed for SP3.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres/GoTrue/Storage) self-hosted via Supabase CLI + Docker, `@supabase/supabase-js` + `@supabase/ssr`, Zod, Vitest, Playwright.

## Global Constraints

- Everything self-hosted via Docker. No cloud provider. (RNF18)
- SQL migrations in `supabase/migrations` are the single source of truth. No Prisma.
- All `public` tables have RLS enabled. (RNF13)
- Passwords hashed by GoTrue (bcrypt). (RNF04)
- All user-facing copy and validation messages in pt-BR. (RNF11)
- Responsive + accessible (labels, contrast, focus). (RNF02, RNF14)
- Action logging on every mutation. (RNF06)
- Target operation latency < 3s. (RNF03)
- A commit per completed task. Docs updated as phases complete.

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`, `.env.example`, `README.md`
- Create: `vitest.config.ts`, `playwright.config.ts`

**Interfaces:**
- Produces: a runnable Next.js dev server on `:3000`; `npm run test` (Vitest), `npm run e2e` (Playwright), `npm run typecheck`.

- [ ] **Step 1: Scaffold Next.js app** (non-interactive)

```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm --yes
```

- [ ] **Step 2: Add deps**

```bash
npm i @supabase/supabase-js @supabase/ssr zod
npm i -D vitest @vitejs/plugin-react @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 3: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "e2e": "playwright test"
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "node", include: ["**/*.test.ts"] },
});
```

- [ ] **Step 5: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
```

- [ ] **Step 6: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 7: README skeleton** — sections: Overview, Prerequisites (Docker, Node, Supabase CLI), Setup, Run, Test, Env vars. (Filled fully in Task 10.)

- [ ] **Step 8: Verify + commit**

Run: `npm run typecheck && npm run dev` (Ctrl-C after it serves). Expected: compiles, serves `:3000`.

```bash
git add -A && git commit -m "chore: scaffold Next.js + TS + Tailwind + test tooling"
```

---

### Task 2: Self-hosted Supabase stack

**Files:**
- Create: `supabase/config.toml` (via CLI), `.env.local` (gitignored)

**Interfaces:**
- Produces: local Supabase at `http://127.0.0.1:54321`, Studio at `:54323`, Postgres at `:54322`; anon + service_role keys.

- [ ] **Step 1: Init Supabase**

```bash
npx supabase init
```

- [ ] **Step 2: Start the stack (Docker)**

```bash
npx supabase start
```
Expected: prints `API URL`, `anon key`, `service_role key`, `DB URL`.

- [ ] **Step 3: Copy keys into `.env.local`** (from the `supabase start` output) using the `.env.example` keys.

- [ ] **Step 4: Sanity check**

Run: `curl -s http://127.0.0.1:54321/rest/v1/ -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | head -c 200`
Expected: a JSON/OpenAPI response (not connection refused).

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml .gitignore && git commit -m "chore: self-hosted Supabase local stack"
```

---

### Task 3: Schema migration + RLS + types

**Files:**
- Create: `supabase/migrations/0001_foundation.sql`
- Create: `lib/database.types.ts` (generated)

**Interfaces:**
- Produces: tables `profiles`, `pets`, `walker_profiles`, `availability`, `action_logs`; enum `pet_size`; RLS policies; generated `Database` type.

- [ ] **Step 1: Write migration `supabase/migrations/0001_foundation.sql`**

```sql
create type pet_size as enum ('PEQUENO','MEDIO','GRANDE');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  roles text[] not null check (
    array_length(roles,1) >= 1
    and roles <@ array['tutor','walker']::text[]
  ),
  created_at timestamptz not null default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  size pet_size not null,
  breed text,
  age int check (age >= 0),
  behavior text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table walker_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  experience_years int not null default 0 check (experience_years >= 0),
  base_price numeric not null default 0 check (base_price >= 0),
  service_region text,
  photo_url text,
  accepted_sizes pet_size[] not null default array['PEQUENO','MEDIO','GRANDE']::pet_size[],
  accepted_behaviors text[] not null default array[]::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  walker_id uuid not null references walker_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

create table action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index pets_tutor_idx on pets(tutor_id);
create index availability_walker_idx on availability(walker_id);

-- RLS
alter table profiles enable row level security;
alter table pets enable row level security;
alter table walker_profiles enable row level security;
alter table availability enable row level security;
alter table action_logs enable row level security;

create policy profiles_select_own on profiles for select using (auth.uid() = id);
create policy profiles_select_walkers on profiles for select
  using (exists (select 1 from walker_profiles w where w.id = profiles.id));
create policy profiles_insert_own on profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on profiles for update using (auth.uid() = id);

create policy pets_all_own on pets for all
  using (auth.uid() = tutor_id) with check (auth.uid() = tutor_id);

create policy walkers_public_read on walker_profiles for select using (true);
create policy walkers_write_own on walker_profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy avail_public_read on availability for select using (true);
create policy avail_write_own on availability for all
  using (auth.uid() = walker_id) with check (auth.uid() = walker_id);

-- action_logs: no client access; service role bypasses RLS.
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db reset
```
Expected: migration applies without error.

- [ ] **Step 3: Generate types**

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations lib/database.types.ts && git commit -m "feat: foundation schema + RLS + generated types"
```

---

### Task 4: Supabase clients + session helper

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`, `lib/auth.ts`
- Create: `middleware.ts`

**Interfaces:**
- Produces:
  - `createServerClient(): SupabaseClient<Database>` (cookie-bound, server components/actions)
  - `createBrowserClient(): SupabaseClient<Database>`
  - `createAdminClient(): SupabaseClient<Database>` (service role, server-only)
  - `getSessionUser(): Promise<{ id: string; email: string } | null>`
  - `requireUser(): Promise<User>` (redirects to `/login` if none)

- [ ] **Step 1: `lib/supabase/server.ts`**

```ts
import { createServerClient as _create } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createServerClient() {
  const store = await cookies();
  return _create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
      },
    },
  );
}
```

- [ ] **Step 2: `lib/supabase/client.ts`**

```ts
import { createBrowserClient as _create } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
export const createBrowserClient = () =>
  _create<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
```

- [ ] **Step 3: `lib/supabase/admin.ts`**

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
export const createAdminClient = () =>
  createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
```

- [ ] **Step 4: `lib/auth.ts`**

```ts
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const sb = await createServerClient();
  const { data } = await sb.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
```

- [ ] **Step 5: `middleware.ts`** (refresh session cookies)

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );
  await sb.auth.getUser();
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck` → PASS.
```bash
git add -A && git commit -m "feat: supabase clients + auth session helpers + middleware"
```

---

### Task 5: Action log helper (pure interface + unit test)

**Files:**
- Create: `lib/log.ts`, `lib/log.test.ts`

**Interfaces:**
- Produces: `logAction(input: { actorId?: string; action: string; entity: string; entityId?: string; metadata?: Record<string, unknown> }): Promise<void>` — inserts via admin client. Consumed by every mutation task.

- [ ] **Step 1: Failing test `lib/log.test.ts`**

```ts
import { expect, test, vi } from "vitest";
import { buildLogRow } from "@/lib/log";

test("buildLogRow maps input to a valid row", () => {
  const row = buildLogRow({ actorId: "u1", action: "pet.create", entity: "pets", entityId: "p1" });
  expect(row).toMatchObject({ actor_id: "u1", action: "pet.create", entity: "pets", entity_id: "p1", metadata: {} });
});
```

- [ ] **Step 2: Run → FAIL** (`buildLogRow` not exported). `npm run test`.

- [ ] **Step 3: Implement `lib/log.ts`**

```ts
import { createAdminClient } from "@/lib/supabase/admin";

export interface LogInput {
  actorId?: string; action: string; entity: string;
  entityId?: string; metadata?: Record<string, unknown>;
}
export function buildLogRow(i: LogInput) {
  return { actor_id: i.actorId ?? null, action: i.action, entity: i.entity,
    entity_id: i.entityId ?? null, metadata: i.metadata ?? {} };
}
export async function logAction(i: LogInput) {
  await createAdminClient().from("action_logs").insert(buildLogRow(i));
}
```

- [ ] **Step 4: Run → PASS. Commit.**

```bash
git add lib/log.ts lib/log.test.ts && git commit -m "feat: action log helper (RNF06)"
```

---

### Task 6: Auth flows (signup with roles, login, logout)

**Files:**
- Create: `lib/validation/auth.ts`, `app/signup/page.tsx`, `app/login/page.tsx`, `app/(app)/actions/auth.ts`, `app/logout/route.ts`, `components/ui/Field.tsx`
- Create: `lib/validation/auth.test.ts`

**Interfaces:**
- Consumes: `createServerClient`, `createAdminClient`, `logAction`.
- Produces: server actions `signUp(formData)`, `signIn(formData)`; creates a `profiles` row with roles on signup.

- [ ] **Step 1: Failing test `lib/validation/auth.test.ts`**

```ts
import { expect, test } from "vitest";
import { signupSchema } from "@/lib/validation/auth";

test("rejects empty roles", () => {
  const r = signupSchema.safeParse({ email: "a@b.com", password: "secret12", displayName: "A", roles: [] });
  expect(r.success).toBe(false);
});
test("accepts tutor+walker", () => {
  const r = signupSchema.safeParse({ email: "a@b.com", password: "secret12", displayName: "A", roles: ["tutor","walker"] });
  expect(r.success).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/validation/auth.ts`**

```ts
import { z } from "zod";
export const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  displayName: z.string().min(1, "Informe seu nome"),
  roles: z.array(z.enum(["tutor", "walker"])).min(1, "Selecione ao menos um perfil"),
});
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/actions/auth.ts`** (server actions)

```ts
"use server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/log";
import { signupSchema, loginSchema } from "@/lib/validation/auth";

export async function signUp(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"), password: formData.get("password"),
    displayName: formData.get("displayName"), roles: formData.getAll("roles"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createServerClient();
  const { data, error } = await sb.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) return { error: "Não foi possível criar a conta" };
  const admin = createAdminClient();
  await admin.from("profiles").insert({ id: data.user.id, display_name: parsed.data.displayName, roles: parsed.data.roles });
  await logAction({ actorId: data.user.id, action: "auth.signup", entity: "profiles", entityId: data.user.id });
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createServerClient();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Credenciais inválidas" };
  redirect("/dashboard");
}
```

- [ ] **Step 6: `app/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
export async function POST() {
  const sb = await createServerClient();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
```

- [ ] **Step 7: `components/ui/Field.tsx`** — labeled input wrapper (accessible: `<label htmlFor>`, error text with `aria-describedby`). Signup/login pages (`app/signup/page.tsx`, `app/login/page.tsx`) are `<form action={signUp}>` / `action={signIn}` with pt-BR labels, role checkboxes (tutor/walker), and an error region.

- [ ] **Step 8: Typecheck, manual smoke (signup → dashboard), commit.**

```bash
git add -A && git commit -m "feat: auth signup(roles)/login/logout (RF01, RF02, RNF04)"
```

---

### Task 7: App shell + role-aware dashboard

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `lib/profile.ts`, `components/Nav.tsx`

**Interfaces:**
- Consumes: `requireUser`, `createServerClient`.
- Produces: `getProfile(): Promise<{ id; display_name; roles: string[] } | null>`; `hasRole(profile, role)`; protected `(app)` group that redirects anonymous users.

- [ ] **Step 1: `lib/profile.ts`**

```ts
import { createServerClient } from "@/lib/supabase/server";
export async function getProfile() {
  const sb = await createServerClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb.from("profiles").select("id, display_name, roles").eq("id", u.user.id).single();
  return data;
}
export const hasRole = (p: { roles: string[] } | null, r: "tutor" | "walker") => !!p?.roles.includes(r);
```

- [ ] **Step 2: `app/(app)/layout.tsx`** — calls `requireUser()` (redirect if anon), renders `<Nav>` with links gated by role (Meus Pets for tutor, Meu Perfil for walker) + logout form POSTing `/logout`.

- [ ] **Step 3: `app/(app)/dashboard/page.tsx`** — greet by `display_name`, show role-based cards.

- [ ] **Step 4: Manual check** — visiting `/dashboard` while logged out redirects to `/login` (CT-NF-03). Commit.

```bash
git add -A && git commit -m "feat: protected app shell + role-aware dashboard (RNF13)"
```

---

### Task 8: Pets CRUD (tutor) — RF03

**Files:**
- Create: `lib/validation/pet.ts`, `lib/validation/pet.test.ts`, `app/(app)/pets/page.tsx`, `app/(app)/pets/new/page.tsx`, `app/(app)/pets/[id]/edit/page.tsx`, `app/(app)/actions/pets.ts`

**Interfaces:**
- Consumes: `createServerClient`, `requireUser`, `logAction`, `pet_size`.
- Produces: `createPet`, `updatePet`, `deletePet` server actions.

- [ ] **Step 1: Failing test `lib/validation/pet.test.ts`**

```ts
import { expect, test } from "vitest";
import { petSchema } from "@/lib/validation/pet";
test("requires name and size", () => {
  expect(petSchema.safeParse({ name: "", size: "GRANDE" }).success).toBe(false);
  expect(petSchema.safeParse({ name: "Rex", size: "GRANDE" }).success).toBe(true);
});
test("rejects invalid size", () => {
  expect(petSchema.safeParse({ name: "Rex", size: "HUGE" }).success).toBe(false);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `lib/validation/pet.ts`**

```ts
import { z } from "zod";
export const petSchema = z.object({
  name: z.string().min(1, "Informe o nome do pet"),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE"], { message: "Selecione o porte" }),
  breed: z.string().optional(),
  age: z.coerce.number().int().min(0).optional(),
  behavior: z.string().optional(),
  notes: z.string().optional(),
});
export type PetInput = z.infer<typeof petSchema>;
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `app/(app)/actions/pets.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/log";
import { petSchema } from "@/lib/validation/pet";

function parse(fd: FormData) {
  return petSchema.safeParse({
    name: fd.get("name"), size: fd.get("size"), breed: fd.get("breed") || undefined,
    age: fd.get("age") || undefined, behavior: fd.get("behavior") || undefined, notes: fd.get("notes") || undefined,
  });
}
export async function createPet(fd: FormData) {
  const user = await requireUser();
  const p = parse(fd); if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { data, error } = await sb.from("pets").insert({ ...p.data, tutor_id: user.id }).select("id").single();
  if (error) return { error: "Não foi possível salvar o pet" };
  await logAction({ actorId: user.id, action: "pet.create", entity: "pets", entityId: data.id });
  revalidatePath("/pets"); return { ok: true };
}
export async function updatePet(id: string, fd: FormData) {
  const user = await requireUser();
  const p = parse(fd); if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { error } = await sb.from("pets").update(p.data).eq("id", id).eq("tutor_id", user.id);
  if (error) return { error: "Não foi possível atualizar o pet" };
  await logAction({ actorId: user.id, action: "pet.update", entity: "pets", entityId: id });
  revalidatePath("/pets"); return { ok: true };
}
export async function deletePet(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  await sb.from("pets").delete().eq("id", id).eq("tutor_id", user.id);
  await logAction({ actorId: user.id, action: "pet.delete", entity: "pets", entityId: id });
  revalidatePath("/pets");
}
```

- [ ] **Step 6: Pages** — `pets/page.tsx` lists the tutor's pets (query own via RLS) with edit/delete; `pets/new` + `pets/[id]/edit` render a shared pet form (name, size select, breed, age, behavior, notes) with error display in pt-BR.

- [ ] **Step 7: Manual smoke (create/edit/delete) + commit.**

```bash
git add -A && git commit -m "feat: pets CRUD for tutor (RF03)"
```

---

### Task 9: Walker profile + availability + photo — RF04

**Files:**
- Create: `lib/validation/walker.ts`, `lib/validation/walker.test.ts`, `app/(app)/walker/page.tsx`, `app/(app)/actions/walker.ts`, `supabase/migrations/0002_storage.sql`

**Interfaces:**
- Consumes: `createServerClient`, `requireUser`, `logAction`, Supabase Storage.
- Produces: `saveWalkerProfile`, `addAvailability`, `removeAvailability`, `uploadWalkerPhoto` server actions; Storage bucket `walker-photos`.

- [ ] **Step 1: Storage bucket migration `supabase/migrations/0002_storage.sql`**

```sql
insert into storage.buckets (id, name, public) values ('walker-photos','walker-photos', true)
  on conflict (id) do nothing;
create policy "walker photo read" on storage.objects for select using (bucket_id = 'walker-photos');
create policy "walker photo write own" on storage.objects for insert
  with check (bucket_id = 'walker-photos' and owner = auth.uid());
```
Apply: `npx supabase db reset` then regenerate types.

- [ ] **Step 2: Failing test `lib/validation/walker.test.ts`**

```ts
import { expect, test } from "vitest";
import { walkerSchema, availabilitySchema } from "@/lib/validation/walker";
test("base_price non-negative", () => {
  expect(walkerSchema.safeParse({ bio:"", experienceYears:1, basePrice:-1, serviceRegion:"Centro" }).success).toBe(false);
});
test("availability end after start", () => {
  expect(availabilitySchema.safeParse({ weekday:1, startTime:"10:00", endTime:"09:00" }).success).toBe(false);
  expect(availabilitySchema.safeParse({ weekday:1, startTime:"09:00", endTime:"10:00" }).success).toBe(true);
});
```

- [ ] **Step 3: Run → FAIL.**

- [ ] **Step 4: `lib/validation/walker.ts`**

```ts
import { z } from "zod";
export const walkerSchema = z.object({
  bio: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0),
  basePrice: z.coerce.number().min(0, "Preço não pode ser negativo"),
  serviceRegion: z.string().min(1, "Informe a região de atendimento"),
  acceptedSizes: z.array(z.enum(["PEQUENO", "MEDIO", "GRANDE"])).min(1, "Selecione ao menos um porte"),
  acceptedBehaviors: z.array(z.string()).default([]),
});
export const availabilitySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
}).refine((v) => v.endTime > v.startTime, { message: "Fim deve ser após o início", path: ["endTime"] });
```

- [ ] **Step 5: Run → PASS.**

- [ ] **Step 6: `app/(app)/actions/walker.ts`** — `saveWalkerProfile` upserts `walker_profiles` (id = user.id); `uploadWalkerPhoto` uploads to `walker-photos/<uid>` and stores public URL; `addAvailability`/`removeAvailability` manage slots. Each calls `logAction`. Follow the pets-action pattern (parse → validate → write → log → revalidate).

- [ ] **Step 7: `app/(app)/walker/page.tsx`** — profile form (bio, experience, base price, service region, **accepted pet sizes** checkboxes, **accepted behaviors** tags/free-text) + photo upload + weekly availability editor (list + add/remove) + active toggle. `saveWalkerProfile` upserts `accepted_sizes`/`accepted_behaviors` too. Accessible + pt-BR.

- [ ] **Step 8: Manual smoke + commit.**

```bash
git add -A && git commit -m "feat: walker profile + availability + photo upload (RF04)"
```

---

### Task 10: Recommender stub + e2e tests + docs

**Files:**
- Create: `lib/recommender/index.ts`, `e2e/auth.spec.ts`, `e2e/pets.spec.ts`, `e2e/walker.spec.ts`
- Create/Update: `docs/architecture.md`, `docs/data-model.md`, `docs/endpoints.md`, `docs/progress/2026-07-01-sp0-sp1.md`, `README.md`

**Interfaces:**
- Produces: `recommendWalkers(input): RankedWalker[]` throwing `NotImplemented` (replaced in SP3); green Playwright suite.

- [ ] **Step 1: Recommender stub `lib/recommender/index.ts`**

```ts
export interface RankInput { requestId: string }
export interface RankedWalker { walkerId: string; score: number; reasons: string[] }
export function recommendWalkers(_: RankInput): RankedWalker[] {
  throw new Error("NotImplemented: recommender arrives in SP3");
}
```

- [ ] **Step 2: `e2e/auth.spec.ts`** — CT-USU-01 (signup → dashboard), CT-USU-02 (login), CT-NF-03 (visit `/dashboard` logged out → redirected to `/login`).

```ts
import { test, expect } from "@playwright/test";
test("CT-NF-03 protected route blocks anonymous", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
```

- [ ] **Step 3: `e2e/pets.spec.ts`** — CT-USU-03 (create pet, appears in list), CT-NF-04 (submit empty pet form → visible pt-BR error), CT-NF-06 (reload → pet still listed). Use a helper that signs up a fresh tutor.

- [ ] **Step 4: `e2e/walker.spec.ts`** — CT-USU-04 (create walker profile with region/price/availability, persists).

- [ ] **Step 5: Run e2e**

Run: `npm run e2e` (Supabase + dev server up). Expected: all listed specs PASS.

- [ ] **Step 6: Docs** — write `docs/architecture.md` (module/infra map), `docs/data-model.md` (tables + RLS from migration 0001/0002), `docs/endpoints.md` (server actions + routes catalog), `docs/progress/2026-07-01-sp0-sp1.md` (what shipped, decisions, how to run), finalize `README.md` (setup: `npm i`, `supabase start`, copy keys, `supabase db reset`, `npm run dev`; test commands).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "test+docs: e2e CT-* coverage, recommender stub, SP0+SP1 docs (RNF10)"
```

---

## Self-Review

**Spec coverage:** RF01 (T6), RF02 (T6), RF03 (T8), RF04 (T9); RNF04 (T6), RNF05 (T3), RNF06 (T5), RNF08 (module layout), RNF10 (T10), RNF13 (T3 RLS + T7), RNF18 (T2). Recommender interface stub (T10). All SP0+SP1 spec sections have a task.

**Placeholders:** UI page steps (T6/7/8/9) describe forms rather than full JSX — intentional, since the actions they call are given verbatim and the forms are thin `<form action={...}>` wrappers following one shown pattern. No TBD/TODO left in logic, schema, or tests.

**Type consistency:** `recommendWalkers(RankInput): RankedWalker[]` stub in T10 matches SP2/SP3 consumption. `logAction(LogInput)` used consistently T5–T9. `pet_size` enum values (PEQUENO/MEDIO/GRANDE) consistent across migration, Zod, and tests.
