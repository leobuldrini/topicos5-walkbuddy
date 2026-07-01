# Walk Buddy — SP0 (Foundation) + SP1 (Profiles & Pets) Design

Date: 2026-07-01
Status: Approved (design), pending implementation plan
Scope: First build cycle of the Walk Buddy MVP. Covers RF01, RF02, RF03, RF04 and
the non-functional foundation the rest of the system depends on.

## 1. Context

Walk Buddy is a self-hosted web MVP that connects pet tutors to dog walkers, with an
explainable weighted-ranking recommender as its differentiator. The full MVP is
decomposed into five sub-projects, each with its own spec → plan → build cycle:

| SP | Name | Requirements |
|----|------|--------------|
| SP0 | Foundation | RF01, RF02; RNF01, RNF04, RNF05, RNF08, RNF09, RNF10, RNF18 |
| SP1 | Profiles & Pets | RF03, RF04 |
| SP2 | Walk requests & lifecycle | RF05–RF11, RF15, RF16, RF20 |
| SP3 | Recommender module | RF21–RF28; RNF16, RNF17 |
| SP4 | Reviews, notifications, admin, reports | RF12–RF14, RF17, RF18, RF19 |

Build order: SP0 → SP1 → SP2 → SP3 → SP4. The recommender needs SP1/SP2 data, so its
`/lib/recommender` interface is stubbed in SP0 and implemented in SP3.

This document specifies **SP0 + SP1**, built together as the first cycle.

## 2. Goals & non-goals

**Goals**
- A running, self-hosted stack: Next.js app + Supabase (Postgres, Auth, Storage) in Docker.
- Email/password auth with secure hashing (RNF04); protected routes.
- Role model: a user may act as tutor, walker, or both (RF02).
- Tutors manage pets (create/edit/remove) (RF03).
- Walkers manage a professional profile: photo, bio, experience, base price, service
  region, availability (RF04).
- Row-level security enforcing role-based data access (RNF13).
- Action logging table + helper (RNF06).
- Reproducible environment via Docker (RNF18) and minimal docs (RNF10).

**Non-goals (this cycle)**
- Walk requests, recommender scoring, reviews, notifications, admin, reports. These are
  SP2–SP4. Only the recommender module *interface* is stubbed here.
- Cloud hosting, real payments, native app, realtime, GPS.

## 3. Architecture

Single TypeScript codebase, everything self-hosted:

```
Browser ── Next.js (App Router, TS, Tailwind)
              │  Server Actions + Route Handlers (business rules, validation)
              │  /lib/recommender  (interface stub only in SP0)
              ▼
        Supabase self-hosted (Docker)
          ├─ Postgres   (data + RLS)
          ├─ GoTrue      (email/password auth, bcrypt)
          ├─ Storage     (walker photos)
          ├─ Kong        (API gateway)
          └─ Studio      (admin/db UI, dev only)
```

Separation required by RNF07 is preserved as modules: `app/` (frontend + API),
`lib/` (domain logic incl. recommender), `supabase/` (schema, migrations, config).

**Dev infra:** `supabase start` (Supabase CLI) spins the full stack in Docker locally.
`supabase/config.toml` is versioned.

**Deploy/demo infra:** official `supabase/docker` compose on any host + the Next.js
app container. No cloud provider, no billing risk (RNF18).

**Data access:** SQL migrations in `supabase/migrations` are the single source of truth.
TypeScript types generated from the schema (`supabase gen types`). Data access via
`supabase-js` (server client with service role on the server; anon client + RLS on the
edge). **No Prisma** — avoids a second migration system competing with Supabase's.

## 4. Data model (SP0 + SP1)

All tables in `public`, all with RLS enabled. Timestamps `created_at`/`updated_at`.

- **profiles** — `id` (PK, FK → `auth.users.id`), `display_name` text, `roles`
  text[] or enum-set constrained to {`tutor`,`walker`} (both = both present),
  `created_at`.
- **pets** — `id` uuid PK, `tutor_id` FK → profiles, `name`, `size` enum
  {`PEQUENO`,`MEDIO`,`GRANDE`}, `breed`, `age` int, `behavior` text, `notes` text.
- **walker_profiles** — `id` PK/FK → profiles (1:1), `bio`, `experience_years` int,
  `base_price` numeric, `service_region` text, `photo_url` text (Storage), `active` bool.
- **availability** — `id` uuid PK, `walker_id` FK → walker_profiles, `weekday` int
  (0–6), `start_time` time, `end_time` time. Weekly recurring slots.
- **action_logs** — `id` uuid PK, `actor_id` FK → profiles (nullable), `action` text,
  `entity` text, `entity_id` uuid, `metadata` jsonb, `created_at`. Insert-only (RNF06).

Deferred to later SPs (named here for schema awareness, not created now): `walk_requests`,
`reviews`, `notifications`, `reports`, `recommendation_logs`.

**RLS policies (RNF13):**
- `profiles`: a user reads/updates only their own row; walker profiles are
  publicly readable (needed later for browsing/recommendation).
- `pets`: tutor reads/writes only own pets.
- `walker_profiles` + `availability`: walker reads/writes only own; public read.
- `action_logs`: no client insert; written server-side via service role only.

## 5. Auth & roles

- GoTrue email/password, bcrypt hashing (RNF04). Sign up, sign in, sign out.
- On sign-up a `profiles` row is created (DB trigger or server action) with chosen
  role(s).
- Users may hold both roles (RF02); UI exposes tutor and/or walker sections per role.
- Protected routes redirect unauthenticated users to `/login` (CT-NF-03).
- Role gate: tutor-only screens (pets) and walker-only screens (walker profile) check
  the caller's roles.

## 6. Screens & flows (SP1)

- **Auth:** `/signup`, `/login`, sign-out. Role selection at sign-up (tutor/walker/both).
- **Pets (tutor):** list; create; edit; delete. Fields: name, size, breed, age,
  behavior, notes (RF03).
- **Walker profile (walker):** edit bio, experience, base price, service region;
  upload/replace photo (Supabase Storage); manage weekly availability slots;
  toggle active (RF04).
- All screens responsive (RNF02), accessible (labels, contrast, focus — RNF14),
  friendly inline validation errors (RNF11, CT-NF-04).

## 7. Cross-cutting

- **Action logging (RNF06):** `logAction()` server helper writes to `action_logs` on
  sign-up, pet create/edit/delete, walker profile create/update.
- **Errors (RNF11):** validation via a schema lib (Zod); user-facing messages in pt-BR.
- **Performance (RNF03):** simple queries, indexes on FKs; target < 3s.
- **Recommender stub:** `lib/recommender/index.ts` exports the interface
  (`recommendWalkers(request): RankedWalker[]`) throwing `NotImplemented` until SP3,
  so consumers and tests can compile against it.

## 8. Testing (maps to test plan)

- **Vitest** — unit tests for pure domain logic (validation, log helper, future
  recommender). No DB.
- **Playwright** — e2e against the local self-hosted stack:
  - CT-USU-01 create account, CT-USU-02 login
  - CT-USU-03 register pet, CT-USU-04 create walker profile
  - CT-NF-03 protected route blocks anonymous access
  - CT-NF-04 incomplete form shows clear error
  - CT-NF-06 data persists after reload
- Test names reference the CT-* IDs so the test-plan traceability is explicit.

## 9. Documentation deliverables

Heavy, per-phase documentation is a hard requirement for this build.

- `docs/superpowers/specs/` — one design spec per SP (this file is the first).
- `docs/architecture.md` — component/module map, self-hosted infra (RNF10).
- `docs/data-model.md` — tables, relations, RLS (RNF10).
- `docs/endpoints.md` — route handlers / server actions catalog (RNF10).
- `docs/progress/` — dated journal, **one entry per phase**, updated live as each phase
  completes (setup → migrations → auth → pets → walker profile → tests).
- `README.md` — run instructions, env vars, docker/supabase commands, test commands.
- Git initialized; a commit per completed phase.

## 10. Phases (implementation order)

1. Repo + Next.js + TS + Tailwind + tooling; git init; README skeleton.
2. Supabase local stack (`supabase init`/`start`); config.toml; env wiring.
3. Migrations: profiles, pets, walker_profiles, availability, action_logs + RLS.
   Generate TS types.
4. Auth: signup/login/logout, profile creation, role selection, route protection.
5. Pets CRUD (tutor).
6. Walker profile + photo upload + availability (walker).
7. Action logging helper wired into all mutations.
8. Tests (Vitest + Playwright) mapped to CT-* cases.
9. Docs pass: architecture, data-model, endpoints, progress entries, README finalize.

## 11. Acceptance (SP0 + SP1)

- Stack runs fully self-hosted via Docker; documented commands reproduce it.
- User can sign up (tutor/walker/both), log in, log out; protected routes enforced.
- Tutor can create/edit/delete pets; data persists.
- Walker can create/edit profile with photo, region, price, availability; data persists.
- RLS prevents cross-user data access.
- Action logs recorded for mutations.
- Playwright suite green for the listed CT-* cases.
- Docs present and current.
