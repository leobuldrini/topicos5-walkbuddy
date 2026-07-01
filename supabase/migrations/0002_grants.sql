-- The self-hosted CLI no longer auto-exposes new public-schema entities to the
-- Data API roles (see supabase/config.toml `auto_expose_new_tables`). Migration
-- 0001 created tables + RLS policies but never granted the underlying table
-- privileges, so PostgREST (and the service-role client) got "permission
-- denied" even though RLS would have allowed the row. Grant privileges here to
-- match what each RLS policy already permits.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

grant select, insert, update, delete on public.pets to authenticated;
grant all on public.pets to service_role;

grant select on public.walker_profiles to anon, authenticated;
grant insert, update, delete on public.walker_profiles to authenticated;
grant all on public.walker_profiles to service_role;

grant select on public.availability to anon, authenticated;
grant insert, update, delete on public.availability to authenticated;
grant all on public.availability to service_role;

grant select, insert on public.action_logs to service_role;
