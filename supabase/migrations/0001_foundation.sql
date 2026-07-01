create type pet_size as enum ('PEQUENO','MEDIO','GRANDE');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  roles text[] not null check (
    array_length(roles,1) >= 1
    and roles <@ array['tutor','walker']::text[]
  ),
  created_at timestamptz not null default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  size pet_size not null,
  breed text,
  age int check (age >= 0),
  behavior text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table walker_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  experience_years int not null default 0 check (experience_years >= 0),
  base_price numeric not null default 0 check (base_price >= 0),
  service_region text,
  photo_url text,
  accepted_sizes pet_size[] not null default array['PEQUENO','MEDIO','GRANDE']::pet_size[],
  accepted_behaviors text[] not null default array[]::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  walker_id uuid not null references walker_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

create table action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index pets_tutor_idx on pets(tutor_id);
create index availability_walker_idx on availability(walker_id);

-- RLS
alter table profiles enable row level security;
alter table pets enable row level security;
alter table walker_profiles enable row level security;
alter table availability enable row level security;
alter table action_logs enable row level security;

create policy profiles_select_own on profiles for select using (auth.uid() = id);
create policy profiles_select_walkers on profiles for select
  using (exists (select 1 from walker_profiles w where w.id = profiles.id));
create policy profiles_insert_own on profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on profiles for update using (auth.uid() = id);

create policy pets_all_own on pets for all
  using (auth.uid() = tutor_id) with check (auth.uid() = tutor_id);

create policy walkers_public_read on walker_profiles for select using (true);
create policy walkers_write_own on walker_profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy avail_public_read on availability for select using (true);
create policy avail_write_own on availability for all
  using (auth.uid() = walker_id) with check (auth.uid() = walker_id);

-- action_logs: no client access; service role bypasses RLS.
