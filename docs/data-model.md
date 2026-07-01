# Walk Buddy Data Model

Core profile tables:

- `profiles`: display name, roles, `is_admin`.
- `pets`: tutor-owned pets with size, behavior, notes.
- `walker_profiles`: walker details, accepted sizes/behaviors, region, price, active flag.
- `availability`: weekly slots per walker.
- `action_logs`: mutation audit trail written through service role.

Walk lifecycle:

- `walk_requests`: tutor, pet, optional walker, region/date/time, status, price estimate, cancellation fields.
- `payments`: simulated payment per walk request.
- `walk_status`: `solicitado`, `aceito`, `em_andamento`, `concluido`, `cancelado`.
- `payment_status`: `pendente`, `pago`.

Recommender:

- `recommendation_logs`: ranked walker impressions, score, reasons, chosen flag.

Social/admin:

- `reviews`: mutual reviews for walker, tutor, or pet after completed walks.
- `walker_ratings`: view with average walker rating and count.
- `notifications`: in-app notifications.
- `reports`: user reports with `aberta`, `em_analise`, `resolvida`.

All new tables have RLS enabled; service-role writes are used only where client policies should not permit direct mutation.
