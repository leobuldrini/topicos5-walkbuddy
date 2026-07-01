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
  from reviews
  where target_type = 'walker'
  group by target_id;

alter table reviews enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

create policy reviews_read_involved on reviews for select using (
  author_id = auth.uid()
  or (target_type = 'walker' and target_id = auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
);
create policy reviews_write_own on reviews for insert with check (author_id = auth.uid());

create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_update_own on notifications for update using (user_id = auth.uid());

create policy reports_insert_any on reports for insert with check (reporter_id = auth.uid());
create policy reports_read_reporter_or_admin on reports for select using (
  reporter_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
);

grant select on public.walker_ratings to anon, authenticated;
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
