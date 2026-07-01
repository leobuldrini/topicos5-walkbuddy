# Walk Buddy

## Overview

Walk Buddy is a self-hosted, web-based MVP that connects pet tutors ("tutores")
to dog walkers ("passeadores"), with an explainable weighted-ranking recommender
as its differentiator. Built with Next.js (App Router) and Supabase (Postgres,
Auth, Storage), all self-hosted via Docker — no third-party SaaS dependencies.
User-facing copy is in pt-BR.

> Full setup/run/test instructions will be completed in Task 10, once the
> Supabase stack and Docker Compose files exist.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (+ Docker Compose)
- [Node.js](https://nodejs.org/) 20+ and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Setup

_TODO (Task 10): document `npm install`, Supabase CLI bootstrap, and `.env.local`
setup from `.env.example`._

## Run

_TODO (Task 10): document `npm run dev` (Next.js dev server on `:3000`) and how
to start the local Supabase stack._

## Test

- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run test` — unit tests (Vitest)
- `npm run e2e` — end-to-end tests (Playwright)

## Env vars

See `.env.example`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (local: `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose to the client) |
