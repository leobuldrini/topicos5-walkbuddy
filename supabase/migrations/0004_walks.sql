create type walk_status as enum ('solicitado','aceito','em_andamento','concluido','cancelado');
create type payment_status as enum ('pendente','pago');

create table walk_requests (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete restrict,
  walker_id uuid references walker_profiles(id) on delete set null,
  region text not null,
  scheduled_date date not null,
  start_time time not null,
  duration_min int not null check (duration_min > 0),
  location_text text,
  status walk_status not null default 'solicitado',
  price_estimate numeric not null default 0,
  cancel_reason text,
  cancelled_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  walk_request_id uuid not null unique references walk_requests(id) on delete cascade,
  amount numeric not null,
  status payment_status not null default 'pendente',
  method text not null default 'simulado',
  created_at timestamptz not null default now()
);

create index walk_walker_idx on walk_requests(walker_id);
create index walk_tutor_idx on walk_requests(tutor_id);
create index walk_region_date_idx on walk_requests(region, scheduled_date);
create index walk_status_idx on walk_requests(status);

alter table walk_requests enable row level security;
alter table payments enable row level security;

create policy walk_tutor_all on walk_requests for all
  using (auth.uid() = tutor_id) with check (auth.uid() = tutor_id);
create policy walk_walker_read on walk_requests for select
  using (walker_id = auth.uid() or (walker_id is null and status = 'solicitado'));
create policy pay_read on payments for select using (
  exists (select 1 from walk_requests w where w.id = walk_request_id
    and (w.tutor_id = auth.uid() or w.walker_id = auth.uid())));

grant select, insert, update, delete on public.walk_requests to authenticated;
grant all on public.walk_requests to service_role;
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
