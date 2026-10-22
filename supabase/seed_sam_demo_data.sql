-- Sam Chen demo pack (rich data). Alex stays empty (no goals/tasks assigned).
-- Run after bridge migration + seed_demo.sql
-- Also create Auth user: sam@orbital.app / orbital-demo (Auto Confirm on)

-- Drop auto-created member rows that reuse demo emails under random ids
-- (e.g. first login created id "user-xxxxxxx" for alex@orbital.app)
delete from public.members
where email in (
  'alex@orbital.app',
  'sam@orbital.app',
  'jordan@orbital.app',
  'morgan@orbital.app',
  'casey@orbital.app'
)
and id not in ('user-alex', 'user-sam', 'user-jordan', 'user-morgan', 'user-casey');

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
  status = excluded.status,
  updated_at = now();

-- Link Auth users to canonical member ids when present
update public.members m
set auth_user_id = u.id, updated_at = now()
from auth.users u
where lower(u.email) = lower(m.email)
  and m.id in ('user-alex', 'user-sam', 'user-jordan', 'user-morgan', 'user-casey');

insert into public.agents (
  id, name, description, role, status, tone, next_planned_action, avatar_tone, created_date, updated_date
)
values
  (
    'agent-orbit', 'Orbit Agent', 'Project co-pilot', 'Project co-pilot', 'active',
    'Friendly & casual', 'Check in with team on blocked tasks', 'lavender', now(), now()
  ),
  (
    'agent-pulse', 'Pulse Agent', 'Check-in specialist', 'Check-in specialist', 'active',
    'Friendly & casual', 'Send daily digests at 09:00', 'dustyblue', now(), now()
  )
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  tone = excluded.tone,
  next_planned_action = excluded.next_planned_action,
  avatar_tone = excluded.avatar_tone,
  updated_date = now();

-- Goals owned by Sam (not Alex)
insert into public.goals (
  id, title, description, owner_id, owner_name, status, progress, target_date,
  clarifying_questions, created_date, updated_date
)
values
  (
    'goal-1',
    'Launch Q2 product refresh',
    'Ship the redesigned dashboard, onboarding flow, and billing updates before end of quarter.',
    'user-sam', 'Sam Chen', 'active', 62,
    (now() + interval '21 days')::date,
    '{"successLooksLike":"Customers can complete onboarding in under 5 minutes","constraints":"No new infra; reuse existing design system","priority":"high"}'::jsonb,
    now() - interval '28 days', now() - interval '2 hours'
  ),
  (
    'goal-2',
    'Stabilize agent check-in cadence',
    'Tune ping frequency and blocked-task escalation so leads get actionable summaries daily.',
    'user-sam', 'Sam Chen', 'active', 40,
    (now() + interval '14 days')::date,
    '{"successLooksLike":"Zero silent blocked tasks for more than 24h","constraints":"Keep pings under 3/day per member","priority":"medium"}'::jsonb,
    now() - interval '18 days', now() - interval '5 hours'
  ),
  (
    'goal-3',
    'Team capacity planning workshop',
    'Map sprint capacity, identify coverage gaps, and publish a shared availability calendar.',
    'user-sam', 'Sam Chen', 'active', 15,
    (now() + interval '35 days')::date,
    '{"successLooksLike":"Published calendar + capacity sheet for next 6 weeks","constraints":"Async-first; one live workshop max","priority":"low"}'::jsonb,
    now() - interval '7 days', now() - interval '20 hours'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  owner_id = excluded.owner_id,
  owner_name = excluded.owner_name,
  status = excluded.status,
  progress = excluded.progress,
  target_date = excluded.target_date,
  clarifying_questions = excluded.clarifying_questions,
  updated_date = excluded.updated_date;

-- Tasks: assignees are Sam / Jordan / Morgan / Casey — never Alex
insert into public.tasks (
  id, title, description, notes, goal_id, goal_title, assignee_id, assignee_name,
  deadline, status, order_index, check_ins, created_by_ai, created_date, updated_date
)
values
  (
    'task-1', 'Audit current dashboard IA',
    'Capture friction points from last usability session.',
    'Capture friction points from last usability session.',
    'goal-1', 'Launch Q2 product refresh',
    'user-jordan', 'Jordan Lee',
    (now() - interval '3 days')::date, 'done', 1,
    '[{"id":"ci-1","at":"placeholder","note":"IA map completed and shared."}]'::jsonb,
    false, now() - interval '25 days', now() - interval '4 days'
  ),
  (
    'task-2', 'Design onboarding empty states',
    'Match neumorphic visual language from brand kit.',
    'Match neumorphic visual language from brand kit.',
    'goal-1', 'Launch Q2 product refresh',
    'user-sam', 'Sam Chen',
    (now() + interval '2 days')::date, 'in_progress', 2,
    '[{"id":"ci-2","note":"Two variants ready for review."}]'::jsonb,
    false, now() - interval '20 days', now() - interval '6 hours'
  ),
  (
    'task-3', 'Implement billing plan toggle',
    'Blocked on Stripe test keys from finance.',
    'Blocked on Stripe test keys from finance.',
    'goal-1', 'Launch Q2 product refresh',
    'user-morgan', 'Morgan Patel',
    (now() - interval '1 day')::date, 'blocked', 3,
    '[]'::jsonb, false, now() - interval '15 days', now() - interval '12 hours'
  ),
  (
    'task-4', 'Write release notes draft',
    '', '', 'goal-1', 'Launch Q2 product refresh',
    'user-sam', 'Sam Chen',
    (now() + interval '10 days')::date, 'pending', 4,
    '[]'::jsonb, false, now() - interval '10 days', now() - interval '10 days'
  ),
  (
    'task-5', 'Define blocked-task escalation rules',
    'Need help validating thresholds with leads.',
    'Need help validating thresholds with leads.',
    'goal-2', 'Stabilize agent check-in cadence',
    'user-sam', 'Sam Chen',
    (now() + interval '1 day')::date, 'need_help', 1,
    '[{"id":"ci-3","note":"Drafted rules — need Lead sign-off."}]'::jsonb,
    false, now() - interval '12 days', now() - interval '8 hours'
  ),
  (
    'task-6', 'Configure daily ping template',
    'Friendly & casual tone per workspace settings.',
    'Friendly & casual tone per workspace settings.',
    'goal-2', 'Stabilize agent check-in cadence',
    'user-jordan', 'Jordan Lee',
    (now() + interval '4 days')::date, 'in_progress', 2,
    '[]'::jsonb, false, now() - interval '9 days', now() - interval '3 hours'
  ),
  (
    'task-7', 'Collect availability from all members',
    '', '', 'goal-3', 'Team capacity planning workshop',
    'user-casey', 'Casey Brooks',
    (now() + interval '7 days')::date, 'pending', 1,
    '[]'::jsonb, false, now() - interval '5 days', now() - interval '5 days'
  ),
  (
    'task-8', 'Book workshop slot and send invites',
    'Prefer Tuesday/Thursday afternoons.',
    'Prefer Tuesday/Thursday afternoons.',
    'goal-3', 'Team capacity planning workshop',
    'user-sam', 'Sam Chen',
    (now() + interval '12 days')::date, 'pending', 2,
    '[]'::jsonb, false, now() - interval '4 days', now() - interval '4 days'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  notes = excluded.notes,
  goal_id = excluded.goal_id,
  goal_title = excluded.goal_title,
  assignee_id = excluded.assignee_id,
  assignee_name = excluded.assignee_name,
  deadline = excluded.deadline,
  status = excluded.status,
  order_index = excluded.order_index,
  check_ins = excluded.check_ins,
  updated_date = excluded.updated_date;

insert into public.updates (
  id, type, entity_type, entity_id, actor_id, task_id, task_title, user_id, user_name,
  status, message, created_date, updated_date
)
values
  ('upd-1', 'task_status', 'task', 'task-2', 'user-sam', 'task-2', 'Design onboarding empty states', 'user-sam', 'Sam Chen', 'in_progress',
   'Sam moved “Design onboarding empty states” to In Progress', now() - interval '6 hours', now() - interval '6 hours'),
  ('upd-2', 'task_blocked', 'task', 'task-3', 'user-morgan', 'task-3', 'Implement billing plan toggle', 'user-morgan', 'Morgan Patel', 'blocked',
   'Morgan marked “Implement billing plan toggle” as Blocked', now() - interval '12 hours', now() - interval '12 hours'),
  ('upd-3', 'goal_progress', 'goal', 'goal-1', 'agent-orbit', null, null, 'agent-orbit', 'Orbit Agent', null,
   'Orbit Agent updated progress on Launch Q2 product refresh to 62%', now() - interval '2 hours', now() - interval '2 hours'),
  ('upd-4', 'check_in', 'task', 'task-5', 'user-sam', 'task-5', 'Define blocked-task escalation rules', 'user-sam', 'Sam Chen', null,
   'Sam checked in on escalation rules — needs Lead sign-off', now() - interval '8 hours', now() - interval '8 hours'),
  ('upd-5', 'agent_action', 'agent', 'agent-orbit', 'agent-orbit', null, null, 'agent-orbit', 'Orbit Agent', null,
   'Orbit Agent planned: Check in with team on blocked tasks', now() - interval '1 hour', now() - interval '1 hour'),
  ('upd-6', 'task_assigned', 'task', 'task-1', 'agent-orbit', 'task-1', 'Audit current dashboard IA', 'agent-orbit', 'Orbit Agent', null,
   'Orbit Agent assigned Jordan Lee to “Audit current dashboard IA”', now() - interval '14 hours', now() - interval '14 hours'),
  ('upd-7', 'tasks_generated', 'goal', 'goal-2', 'agent-orbit', null, null, 'agent-orbit', 'Orbit Agent', null,
   'Orbit Agent generated tasks for Stabilize agent check-in cadence', now() - interval '18 hours', now() - interval '18 hours'),
  ('upd-8', 'status_change', 'task', 'task-7', 'user-jordan', 'task-7', 'Collect availability from all members', 'user-jordan', 'Jordan Lee', 'done',
   'Jordan moved “Collect availability from all members” to Done', now() - interval '22 hours', now() - interval '22 hours'),
  ('upd-9', 'agent_action', 'agent', 'agent-pulse', 'agent-pulse', null, null, 'agent-pulse', 'Pulse Agent', null,
   'Pulse Agent sent morning digests to 4 teammates', now() - interval '26 hours', now() - interval '26 hours'),
  ('upd-10', 'check_in', 'task', 'task-2', 'user-sam', 'task-2', 'Design onboarding empty states', 'user-sam', 'Sam Chen', null,
   'Sam checked in — empty states waiting on design review', now() - interval '30 hours', now() - interval '30 hours'),
  ('upd-11', 'goal_progress', 'goal', 'goal-3', 'agent-orbit', null, null, 'agent-orbit', 'Orbit Agent', null,
   'Orbit Agent updated progress on Team capacity planning workshop to 15%', now() - interval '34 hours', now() - interval '34 hours'),
  ('upd-12', 'status_change', 'task', 'task-4', 'user-sam', 'task-4', 'Write release notes draft', 'user-sam', 'Sam Chen', 'in_progress',
   'Sam moved “Write release notes draft” to In Progress', now() - interval '40 hours', now() - interval '40 hours')
on conflict (id) do update set
  message = excluded.message,
  actor_id = excluded.actor_id,
  updated_date = excluded.updated_date;

insert into public.pings (
  id, task_id, task_title, assignee_id, assignee_name, message, status, created_date, updated_date
)
values
  (
    'ping-1', 'task-3', 'Implement billing plan toggle', 'user-morgan', 'Morgan Patel',
    'Still blocked on Stripe keys — any update from finance?', 'sent',
    now() - interval '4 hours', now() - interval '4 hours'
  ),
  (
    'ping-2', 'task-5', 'Define blocked-task escalation rules', 'user-sam', 'Sam Chen',
    'Quick check-in: ready for Lead review on escalation rules?', 'pending',
    now() - interval '1 hour', now() - interval '1 hour'
  )
on conflict (id) do update set
  message = excluded.message,
  status = excluded.status,
  updated_date = excluded.updated_date;

insert into public.agent_activity (
  id, agent_id, action, action_type, title, summary, description, created_date, updated_date
)
values
  (
    'aa-1', 'agent-orbit', 'planned_check_in', 'planned_check_in',
    'Next Planned Action', 'Next Planned Action: Check in with team on blocked tasks',
    'Check in with team on blocked tasks', now() - interval '1 hour', now() - interval '1 hour'
  ),
  (
    'aa-2', 'agent-orbit', 'progress_sync', 'progress_sync',
    'Progress sync', 'Synced goal progress for Launch Q2 product refresh',
    'Synced goal progress for Launch Q2 product refresh', now() - interval '2 hours', now() - interval '2 hours'
  ),
  (
    'aa-3', 'agent-pulse', 'ping_drafted', 'ping_drafted',
    'Ping drafted', 'Drafted ping for Morgan on blocked billing task',
    'Drafted ping for Morgan on blocked billing task', now() - interval '4 hours', now() - interval '4 hours'
  ),
  (
    'aa-4', 'agent-pulse', 'digest', 'digest',
    'Morning digest', 'Prepared morning digest for My Team',
    'Prepared morning digest for My Team', now() - interval '18 hours', now() - interval '18 hours'
  )
on conflict (id) do update set
  agent_id = excluded.agent_id,
  action = excluded.action,
  summary = excluded.summary,
  updated_date = excluded.updated_date;

-- Confirm Sam auth user if present
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'sam@orbital.app';
