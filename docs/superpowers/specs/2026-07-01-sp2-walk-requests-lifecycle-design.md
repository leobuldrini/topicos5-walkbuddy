# Walk Buddy — SP2 (Walk Requests & Lifecycle) Design

Date: 2026-07-01
Status: Approved (design), pending implementation plan
Scope: RF05–RF11, RF15, RF16, RF20. Builds on SP0+SP1.

## 1. Context

Second build cycle. Adds the core transactional loop: a tutor browses/requests a walk,
a walker sees compatible requests and accepts/rejects, the walk moves through a status
machine, both keep history, price is estimated, payment is simulated, and the walker
sees an earnings summary. Depends on SP0 (auth, roles, action_logs) and SP1 (pets,
walker_profiles, availability). The recommender (SP3) plugs into request creation later;
SP2 lets the tutor choose a walker from a plain list so the loop works without SP3.

## 2. Goals & non-goals

**Goals**
- Tutor browses available walkers filtered by region (RF05).
- Tutor creates a walk request: pet, date, time, estimated duration, location/region (RF06).
- Walker sees requests compatible with availability + service area (RF07).
- Walker accepts or rejects a request (RF08).
- Status machine: solicitado, aceito, em_andamento, concluido, cancelado (RF09).
- Either party cancels before start, with a recorded reason (RF10).
- Both profiles have a walk history (RF11).
- System computes an estimated price from simple rules (RF15).
- Payment recorded as simulated, no real gateway (RF16).
- Walker sees a summary of completed walks + estimated earnings (RF20).

**Non-goals**
- Recommendation scoring/ranking/explanation (SP3).
- Reviews, notifications feed, admin, reports (SP4). SP2 emits events via action_logs;
  SP4 renders notifications from them.
- Real payment processing.

## 3. Data model additions

- **walk_requests** — `id` uuid PK, `tutor_id` FK→profiles, `pet_id` FK→pets,
  `walker_id` FK→walker_profiles (nullable until a walker is chosen/accepts),
  `region` text, `scheduled_date` date, `start_time` time, `duration_min` int,
  `location_text` text, `status` enum {`solicitado`,`aceito`,`em_andamento`,
  `concluido`,`cancelado`}, `price_estimate` numeric, `cancel_reason` text (nullable),
  `cancelled_by` FK→profiles (nullable), `created_at`, `updated_at`.
- **payments** — `id` uuid PK, `walk_request_id` FK (unique), `amount` numeric,
  `status` enum {`pendente`,`pago`} (simulated), `method` text default `'simulado'`,
  `created_at`. Purely simulated (RF16).

Indexes on `walk_requests(walker_id)`, `(tutor_id)`, `(region, scheduled_date)`,
`(status)`.

**RLS:** tutor reads/writes own requests; walker reads requests where
`walker_id = self` OR (unassigned AND region/availability compatible — enforced at query
layer, RLS allows read of unassigned open requests to walkers); status transitions done
server-side only. `payments` readable by the request's tutor + walker.

## 4. Status machine

```
solicitado ──accept──▶ aceito ──start──▶ em_andamento ──complete──▶ concluido
    │                     │
    └──cancel─────────────┴──cancel(before start)──▶ cancelado
```

- Reject (RF08): walker declines a `solicitado` request → `walker_id` cleared, stays
  `solicitado`, event logged, tutor may choose another walker (matches CT-INT-07).
- Cancel (RF10): allowed from `solicitado` or `aceito` (before start); requires
  `cancel_reason`; sets `cancelled_by`.
- Transitions validated in a single server module `lib/walks/statusMachine.ts` (pure,
  unit-tested). Illegal transitions rejected with a friendly error (RNF11).

## 5. Price estimate (RF15)

Pure function `lib/walks/price.ts`:
`price = walker.base_price * (duration_min / 60) * sizeMultiplier(pet.size)`
where sizeMultiplier: PEQUENO 1.0, MEDIO 1.15, GRANDE 1.3. Estimate shown before
confirmation; persisted on the request when a walker is set. Deterministic → unit-tested.

## 6. Screens & flows

**Tutor**
- Browse walkers by region (RF05): list of active walkers whose service_region matches,
  showing price, experience, avg rating (rating from SP4; show base fields now).
- Create walk request (RF06): select pet, date, time, duration, location/region; live
  price estimate; submit → status `solicitado`.
- Request detail: current status, chosen walker, price, cancel button (with reason).
- History (RF11): past + active requests with statuses.

**Walker**
- Incoming compatible requests (RF07): open `solicitado` requests matching availability
  (weekday/time window) and service_region.
- Accept / reject (RF08): accept → `aceito` + payment row `pendente`; reject → detach.
- Progress controls: mark `em_andamento`, then `concluido`; completion sets payment
  `pago` (simulated, RF16).
- Earnings summary (RF20): count of `concluido` walks + sum of their `price_estimate`.
- History (RF11).

All responsive (RNF02), accessible (RNF14), friendly errors incl. missing required
fields (RNF11, CT-INT-08).

## 7. Cross-cutting

- **Action logging (RNF06):** log request create, accept, reject, start, complete,
  cancel, payment. These rows also feed SP4 notifications.
- **Recommender hook:** request-create page calls `lib/recommender.recommendWalkers()`;
  in SP2 the stub returns empty/throws-caught → falls back to the plain region list.
  SP3 replaces the stub; no SP2 UI change needed beyond swapping the list source.
- **Performance (RNF03):** indexed queries; target < 3s (CT-NF-01).

## 8. Testing (maps to test plan)

- **Vitest** — statusMachine transitions (legal + illegal), price estimate values.
- **Playwright** — CT-INT-01 request sent, CT-INT-06 accept → aceito, CT-INT-07 reject →
  reselect, CT-INT-08 missing required field error, CT-INT-09 completed walk in history,
  CT-USU-05 create request, CT-USU-08 choose walker, CT-USU-09 accept, CT-NF-06 persist.

## 9. Docs deliverables

Update `docs/data-model.md` (new tables + status machine), `docs/endpoints.md` (request
lifecycle actions), add `docs/progress/` entries per phase, update README run steps.

## 10. Phases

1. Migrations: walk_requests, payments, enums, indexes, RLS. Regenerate types.
2. Status machine + price modules (pure) + unit tests.
3. Tutor: browse walkers, create request with live price estimate.
4. Walker: compatible requests list, accept/reject.
5. Progress: em_andamento → concluido; simulated payment.
6. Cancel with reason (both roles).
7. History (both) + walker earnings summary.
8. Action logging wired to all transitions.
9. Playwright/Vitest for CT-* cases; docs pass.

## 11. Acceptance

Tutor creates a request and sees a price estimate; walker sees only compatible requests
and can accept/reject; status machine enforces legal transitions; cancel records a reason;
completion produces a simulated payment; both roles see history; walker sees earnings;
listed CT-* tests green; docs current.
