# Walk Buddy

## Overview

Walk Buddy is a self-hosted web MVP that connects pet tutors to dog walkers, with
an explainable weighted-ranking recommender as its differentiator. It uses
Next.js App Router and Supabase for Postgres, Auth, and Storage. User-facing copy
is in pt-BR.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ and npm
- Supabase CLI

## Setup

```bash
npm install
npx supabase start
```

Copy the local Supabase URL, anon key, and service role key into `.env.local`
using `.env.example` as the template. Then apply migrations:

```bash
npx supabase db reset
```

## Run

```bash
npm run dev
```

Next.js serves the app at `http://localhost:3000`. Supabase runs locally through
the CLI stack.

## Test

- `npm run test`: unit tests with Vitest
- `npm run typecheck`: TypeScript checking
- `npm run build`: production build
- `npm run lint`: ESLint
- `npm run e2e`: Playwright e2e tests

## Admin Bootstrap

Promote the first admin after signup through Supabase Studio or SQL:

```sql
update profiles set is_admin = true where id = '<uuid>';
```

Admin routes are server-gated by `profiles.is_admin`.

## Env Vars

See `.env.example`:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, local default `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key, server-side only |
| `OPENROUTER_API_KEY` | Server-side OpenRouter key used by the LLM recommender |
| `OPENROUTER_MODEL` | OpenRouter model, default `cohere/north-mini-code:free` |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL, default `https://openrouter.ai/api/v1` |
| `OPENROUTER_TIMEOUT_MS` | LLM request timeout before falling back to local ranking, default `8000` |
