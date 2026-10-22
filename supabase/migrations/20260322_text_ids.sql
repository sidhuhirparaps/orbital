-- Orbital uses text ids (goal-1, agent-orbit, …).
-- Drop FKs first, convert columns, then recreate FKs as text→text.

-- 1) Drop foreign keys that block type changes
do $$
declare r record;
begin
  for r in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where contype = 'f'
      and connamespace = 'public'::regnamespace
      and (
        conrelid::regclass::text in (
          'public.goals', 'public.tasks', 'public.updates',
          'public.pings', 'public.agents', 'public.agent_activity',
          'goals', 'tasks', 'updates', 'pings', 'agents', 'agent_activity'
        )
        or confrelid::regclass::text in (
          'public.goals', 'public.tasks', 'public.updates',
          'public.pings', 'public.agents', 'public.agent_activity',
          'goals', 'tasks', 'updates', 'pings', 'agents', 'agent_activity'
        )
      )
  loop
    execute format('alter table %s drop constraint if exists %I', r.tbl, r.conname);
  end loop;
end $$;

-- 2) Convert primary keys
alter table public.agents
  alter column id type text using id::text;

alter table public.goals
  alter column id type text using id::text;

alter table public.tasks
  alter column id type text using id::text;

alter table public.updates
  alter column id type text using id::text;

alter table public.pings
  alter column id type text using id::text;

alter table public.agent_activity
  alter column id type text using id::text;

-- 3) Convert FK / reference columns (cast uuid → text when needed)
alter table public.goals
  alter column owner_id type text using owner_id::text;

alter table public.tasks
  alter column goal_id type text using goal_id::text;

alter table public.tasks
  alter column assignee_id type text using assignee_id::text;

alter table public.updates
  alter column task_id type text using task_id::text;

alter table public.updates
  alter column user_id type text using user_id::text;

alter table public.updates
  alter column actor_id type text using actor_id::text;

alter table public.updates
  alter column entity_id type text using entity_id::text;

alter table public.pings
  alter column task_id type text using task_id::text;

alter table public.pings
  alter column assignee_id type text using assignee_id::text;

alter table public.agent_activity
  alter column agent_id type text using agent_id::text;

alter table public.agent_activity
  alter column related_goal_id type text using related_goal_id::text;

alter table public.agent_activity
  alter column related_task_id type text using related_task_id::text;

alter table public.agent_activity
  alter column related_user_id type text using related_user_id::text;

-- 4) Recreate useful FKs (text → text). Skip if you prefer no FKs.
alter table public.tasks
  drop constraint if exists tasks_goal_id_fkey;
alter table public.tasks
  add constraint tasks_goal_id_fkey
  foreign key (goal_id) references public.goals(id) on delete set null;

alter table public.pings
  drop constraint if exists pings_task_id_fkey;
alter table public.pings
  add constraint pings_task_id_fkey
  foreign key (task_id) references public.tasks(id) on delete set null;

alter table public.agent_activity
  drop constraint if exists agent_activity_agent_id_fkey;
alter table public.agent_activity
  add constraint agent_activity_agent_id_fkey
  foreign key (agent_id) references public.agents(id) on delete set null;
