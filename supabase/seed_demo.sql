-- Optional demo rows (run after migration). Safe to re-run.
insert into public.members (id, name, email, role, status, joined_at)
values
  ('user-alex', 'Alex Rivera', 'alex@orbital.app', 'lead', 'active', now() - interval '90 days'),
  ('user-sam', 'Sam Chen', 'sam@orbital.app', 'owner', 'active', now() - interval '120 days'),
  ('user-jordan', 'Jordan Lee', 'jordan@orbital.app', 'member', 'active', now() - interval '45 days'),
  ('user-morgan', 'Morgan Patel', 'morgan@orbital.app', 'member', 'active', now() - interval '30 days'),
  ('user-casey', 'Casey Brooks', 'casey@orbital.app', 'viewer', 'active', now() - interval '14 days')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status;

insert into public.agents (
  id, name, description, role, status, tone, next_planned_action, avatar_tone, created_date, updated_date
)
values
  (
    'agent-orbit',
    'Orbit Agent',
    'Project co-pilot',
    'Project co-pilot',
    'active',
    'Friendly & casual',
    'Check in with team on blocked tasks',
    'lavender',
    now(),
    now()
  ),
  (
    'agent-pulse',
    'Pulse Agent',
    'Check-in specialist',
    'Check-in specialist',
    'active',
    'Friendly & casual',
    'Send daily digests at 09:00',
    'dustyblue',
    now(),
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  tone = excluded.tone,
  next_planned_action = excluded.next_planned_action,
  avatar_tone = excluded.avatar_tone,
  updated_date = now();

update public.settings
set
  workspace_name = 'My Team',
  onboarding_complete = true,
  updated_at = now()
where id = 'default';
