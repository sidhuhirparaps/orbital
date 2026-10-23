-- Scope Orbital project data to existing public.workspaces / public.workspace_members.
-- Does NOT create those tables (they already exist). Safe to re-run.

-- 1) Ensure workspace_id on project tables
alter table public.goals
  add column if not exists workspace_id uuid;

alter table public.tasks
  add column if not exists workspace_id uuid;

alter table public.updates
  add column if not exists workspace_id uuid;

alter table public.pings
  add column if not exists workspace_id uuid;

alter table public.agents
  add column if not exists workspace_id uuid;

alter table public.agent_activity
  add column if not exists workspace_id uuid;

-- 2) Indexes for scoped queries
create index if not exists goals_workspace_id_idx on public.goals (workspace_id);
create index if not exists tasks_workspace_id_idx on public.tasks (workspace_id);
create index if not exists updates_workspace_id_idx on public.updates (workspace_id);
create index if not exists pings_workspace_id_idx on public.pings (workspace_id);
create index if not exists agents_workspace_id_idx on public.agents (workspace_id);
create index if not exists agent_activity_workspace_id_idx on public.agent_activity (workspace_id);
create index if not exists workspace_members_email_idx on public.workspace_members (lower(email));
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- 3) Backfill: only when there is exactly ONE workspace (unambiguous).
-- If you have multiple workspaces with orphan rows, resolve those manually first.
do $$
declare
  ws_count int;
  ws_id uuid;
begin
  select count(*) into ws_count from public.workspaces;
  if ws_count = 1 then
    select id into ws_id from public.workspaces limit 1;
    update public.goals set workspace_id = ws_id where workspace_id is null;
    update public.tasks set workspace_id = ws_id where workspace_id is null;
    update public.updates set workspace_id = ws_id where workspace_id is null;
    update public.pings set workspace_id = ws_id where workspace_id is null;
    update public.agents set workspace_id = ws_id where workspace_id is null;
    update public.agent_activity set workspace_id = ws_id where workspace_id is null;
  elsif ws_count > 1 then
    raise notice 'Multiple workspaces found — skipped auto-backfill of null workspace_id rows. Assign them manually.';
  end if;
end $$;

-- 4) RLS: keep authenticated access for now (app filters by workspace_id).
-- Tighten to membership-based policies in a follow-up once client scoping is verified.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

do $$
declare t text;
begin
  foreach t in array array['workspaces', 'workspace_members']
  loop
    execute format('drop policy if exists "orbital_authenticated_all" on public.%I', t);
    execute format(
      'create policy "orbital_authenticated_all" on public.%I
       for all to authenticated
       using (true) with check (true)', t
    );
  end loop;
end $$;
