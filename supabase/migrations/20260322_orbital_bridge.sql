-- Orbital replica bridge: add missing tables/columns + RLS
-- Project: wxxrrmvzrgalqkupxotz

-- 1) members (team)
create table if not exists public.members (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'member'
    check (role in ('owner', 'lead', 'member', 'viewer')),
  status text not null default 'active',
  avatar text,
  joined_at timestamptz not null default now(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) settings (single-row workspace prefs)
create table if not exists public.settings (
  id text primary key default 'default',
  workspace_name text not null default 'My Team',
  working_hours_start text default '09:00',
  working_hours_end text default '17:00',
  ping_frequency text default 'Once daily',
  ai_tone text default 'Friendly & casual',
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values ('default')
on conflict (id) do nothing;

-- 3) columns Orbital UI needs that are missing today
alter table public.goals
  add column if not exists progress numeric default 0;

alter table public.tasks
  add column if not exists check_ins jsonb not null default '[]'::jsonb,
  add column if not exists notes text;

alter table public.updates
  add column if not exists type text,
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists actor_id text;

alter table public.agents
  add column if not exists role text,
  add column if not exists status text default 'active',
  add column if not exists tone text,
  add column if not exists next_planned_action text,
  add column if not exists avatar_tone text;

alter table public.agent_activity
  add column if not exists agent_id text,
  add column if not exists action text,
  add column if not exists summary text;

-- 4) RLS
alter table public.members enable row level security;
alter table public.settings enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.updates enable row level security;
alter table public.agents enable row level security;
alter table public.agent_activity enable row level security;
alter table public.pings enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'members','settings','goals','tasks','updates','agents','agent_activity','pings'
  ]
  loop
    execute format('drop policy if exists "orbital_authenticated_all" on public.%I', t);
    execute format(
      'create policy "orbital_authenticated_all" on public.%I
       for all to authenticated
       using (true) with check (true)', t
    );
  end loop;
end $$;
