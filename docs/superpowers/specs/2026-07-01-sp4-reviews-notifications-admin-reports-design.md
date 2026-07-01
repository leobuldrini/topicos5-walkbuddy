# Walk Buddy — SP4 (Reviews, Notifications, Admin, Reports) Design

Date: 2026-07-01
Status: Approved (design), pending implementation plan
Scope: RF12–RF14, RF17, RF18, RF19. Final build cycle. Builds on SP0–SP3.

## 1. Context

Last cycle. Adds the peripheral features that close the loop: mutual reviews after a
walk, walker average rating, simple event notifications, an admin area, and user reports
(denúncias). Depends on completed walks (SP2) and reuses the SP0 action_logs as the
event source for notifications.

## 2. Goals & non-goals

**Goals**
- After completion, tutor reviews the walker (rating + comment) (RF12).
- After completion, walker reviews the tutor or the pet (rating + comment) (RF13).
- Walker profile shows average rating (RF14).
- Simple notifications on relevant events: accept, cancel, start, complete (RF17).
- Admin web area: view users, walks, reports, reviews (RF18).
- Tutor and walker can report a user for misconduct (RF19).

**Non-goals**
- Realtime push, email/SMS. Notifications are an in-app feed (polled/read on load).
- Moderation automation. Admin actions are view + basic status changes.

## 3. Data model additions

- **reviews** — `id` uuid PK, `walk_request_id` FK, `author_id` FK→profiles,
  `target_type` enum {`walker`,`tutor`,`pet`}, `target_id` uuid, `rating` int (1–5,
  CHECK), `comment` text, `created_at`. Unique per (walk_request_id, author_id,
  target_type) so a walk is reviewed once per side.
- **notifications** — `id` uuid PK, `user_id` FK→profiles, `type` text, `payload` jsonb,
  `read` bool default false, `created_at`.
- **reports** — `id` uuid PK, `reporter_id` FK→profiles, `reported_user_id` FK→profiles,
  `walk_request_id` FK (nullable), `reason` text, `status` enum
  {`aberta`,`em_analise`,`resolvida`} default `aberta`, `created_at`.
- **profiles.is_admin** bool default false (added here).

Average rating (RF14): a SQL view `walker_ratings` (avg + count over reviews where
`target_type='walker'`), read on the walker profile and walker-browse list.

**RLS:** reviews readable by involved parties + public avg via the view; author writes
own. notifications readable/updatable (read flag) by owner only. reports insertable by
any authed user, readable by reporter + admins. Admin-only tables/rows gated by
`is_admin` (checked server-side; RLS policies allow admin read).

## 4. Reviews (RF12, RF13, RF14)

- Review prompt appears on a `concluido` walk for each side that hasn't reviewed.
- Tutor → walker; walker → tutor or pet. Rating 1–5 + optional comment.
- Walker avg rating computed from the `walker_ratings` view; shown on profile (RF14) and
  fed into the recommender's ratings criterion (SP3 already reads avg rating; before any
  reviews it used a neutral prior).

## 5. Notifications (RF17)

- Server helper `notify(userId, type, payload)` inserts a `notifications` row. Called
  from the SP2 lifecycle transitions (accept, cancel, start, complete) — wired here.
- In-app notifications feed: bell + list, unread count, mark-as-read. Loaded on
  navigation (no realtime).

## 6. Admin area (RF18)

- `/admin` gated by `is_admin`. Tabs: Users, Walks, Reviews, Reports.
- Read-only tables with basic filters; report status change
  (aberta → em_analise → resolvida). No destructive bulk actions.

## 7. Reports / denúncias (RF19)

- "Report user" action available from a walk/profile context to the counterpart.
- Form: reason (+ optional link to walk). Creates a `reports` row (`aberta`). Visible to
  admins in the admin area.

## 8. Cross-cutting

- Action logging (RNF06) for review submit, report submit, admin status change.
- Accessibility (RNF14), responsive (RNF02), friendly errors (RNF11).
- Role-based access (RNF13) enforced by RLS + server checks; admin strictly gated.

## 9. Testing (maps to test plan)

- **Vitest** — avg-rating aggregation helper; review uniqueness guard; notify payload.
- **Playwright** — CT-USU-10 evaluate walk after completion, CT-INT-10 review saved and
  used in future recommendations (assert recommender picks up new avg), notification
  appears on accept, report submission visible in admin, admin access blocked for
  non-admin (extends CT-NF-03).

## 10. Docs deliverables

`docs/data-model.md` (reviews, notifications, reports, walker_ratings view, is_admin),
`docs/endpoints.md` (review/report/admin/notification actions), `docs/progress/` entries,
README (admin bootstrap: how to flag the first admin), final architecture pass.

## 11. Phases

1. Migrations: reviews, notifications, reports, is_admin, walker_ratings view, RLS; types.
2. Reviews: prompt on completed walk, submit, uniqueness; avg rating on profile (RF12–14).
3. Notifications: notify helper wired to SP2 transitions; in-app feed + read (RF17).
4. Reports: report action + form (RF19).
5. Admin area: gated `/admin` with Users/Walks/Reviews/Reports + report status (RF18).
6. Action logging; Playwright/Vitest for CT-* cases; docs pass.

## 12. Acceptance

Both sides can review a completed walk once; walker profile shows avg rating and the
recommender reflects it; lifecycle events produce in-app notifications; users can report
misconduct; an admin can view users/walks/reviews/reports and change report status while
non-admins are blocked; listed CT-* tests green; docs current.
