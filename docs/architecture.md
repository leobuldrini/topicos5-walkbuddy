# Walk Buddy Architecture

Walk Buddy is a self-hosted Next.js App Router application backed by Supabase.

## Layers

- `app/`: routes, layouts, route handlers, and server actions.
- `components/`: reusable form and navigation components.
- `lib/validation/`: Zod schemas for form inputs.
- `lib/walks/`: pure walk lifecycle, availability, price, and earnings logic.
- `lib/recommender/`: pure deterministic ranking plus a thin Supabase adapter.
- `supabase/migrations/`: schema, RLS, storage, and grants. This is the source of truth.

## Runtime Flow

Authenticated users enter the protected `(app)` layout. Tutors manage pets, browse walkers, create walk requests, choose recommended walkers, review completed walks, report users, and read notifications. Walkers maintain profile/availability, accept or reject compatible open requests, progress accepted walks, review tutors/pets, and track earnings. Admin routes are gated by `profiles.is_admin` before using the service-role client for cross-user tables.

## Security

Public tables use RLS. Server actions re-check authentication and ownership because Server Actions can be called by direct POST. Admin reads use `createAdminClient()` only after `requireAdmin()`.
