create table recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  walk_request_id uuid not null references walk_requests(id) on delete cascade,
  walker_id uuid not null references walker_profiles(id) on delete cascade,
  score numeric not null,
  rank int not null,
  factors jsonb not null default '{}',
  shown_at timestamptz not null default now(),
  chosen boolean not null default false,
  created_at timestamptz not null default now()
);

create index reclog_request_idx on recommendation_logs(walk_request_id);

alter table recommendation_logs enable row level security;

create policy reclog_read on recommendation_logs for select using (
  exists (select 1 from walk_requests w where w.id = walk_request_id and w.tutor_id = auth.uid())
);

grant select on public.recommendation_logs to authenticated;
grant all on public.recommendation_logs to service_role;
