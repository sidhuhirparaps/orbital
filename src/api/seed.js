const daysFromNow = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(17, 0, 0, 0)
  return d.toISOString()
}

const hoursAgo = (n) => {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

export const SEED_VERSION = 2

export const CURRENT_USER_ID = 'user-alex'

export function createSeedData() {
  const members = [
    {
      id: CURRENT_USER_ID,
      name: 'Alex Rivera',
      email: 'alex@orbital.app',
      role: 'lead',
      avatar: null,
      status: 'active',
      joinedAt: daysFromNow(-90),
    },
    {
      id: 'user-sam',
      name: 'Sam Chen',
      email: 'sam@orbital.app',
      role: 'owner',
      avatar: null,
      status: 'active',
      joinedAt: daysFromNow(-120),
    },
    {
      id: 'user-jordan',
      name: 'Jordan Lee',
      email: 'jordan@orbital.app',
      role: 'member',
      avatar: null,
      status: 'active',
      joinedAt: daysFromNow(-45),
    },
    {
      id: 'user-morgan',
      name: 'Morgan Patel',
      email: 'morgan@orbital.app',
      role: 'member',
      avatar: null,
      status: 'active',
      joinedAt: daysFromNow(-30),
    },
    {
      id: 'user-casey',
      name: 'Casey Brooks',
      email: 'casey@orbital.app',
      role: 'viewer',
      avatar: null,
      status: 'active',
      joinedAt: daysFromNow(-14),
    },
  ]

  const goals = [
    {
      id: 'goal-1',
      title: 'Launch Q2 product refresh',
      description:
        'Ship the redesigned dashboard, onboarding flow, and billing updates before end of quarter.',
      status: 'active',
      progress: 62,
      ownerId: CURRENT_USER_ID,
      dueDate: daysFromNow(21),
      createdAt: daysFromNow(-28),
      updatedAt: hoursAgo(2),
      clarifyingAnswers: {
        successLooksLike: 'Customers can complete onboarding in under 5 minutes',
        constraints: 'No new infra; reuse existing design system',
        priority: 'high',
      },
    },
    {
      id: 'goal-2',
      title: 'Stabilize agent check-in cadence',
      description:
        'Tune ping frequency and blocked-task escalation so leads get actionable summaries daily.',
      status: 'active',
      progress: 40,
      ownerId: 'user-sam',
      dueDate: daysFromNow(14),
      createdAt: daysFromNow(-18),
      updatedAt: hoursAgo(5),
      clarifyingAnswers: {
        successLooksLike: 'Zero silent blocked tasks for more than 24h',
        constraints: 'Keep pings under 3/day per member',
        priority: 'medium',
      },
    },
    {
      id: 'goal-3',
      title: 'Team capacity planning workshop',
      description:
        'Map sprint capacity, identify coverage gaps, and publish a shared availability calendar.',
      status: 'active',
      progress: 15,
      ownerId: CURRENT_USER_ID,
      dueDate: daysFromNow(35),
      createdAt: daysFromNow(-7),
      updatedAt: hoursAgo(20),
      clarifyingAnswers: {
        successLooksLike: 'Published calendar + capacity sheet for next 6 weeks',
        constraints: 'Async-first; one live workshop max',
        priority: 'low',
      },
    },
  ]

  const tasks = [
    {
      id: 'task-1',
      goalId: 'goal-1',
      title: 'Audit current dashboard IA',
      notes: 'Capture friction points from last usability session.',
      status: 'done',
      assigneeId: 'user-jordan',
      order: 1,
      dueDate: daysFromNow(-3),
      createdAt: daysFromNow(-25),
      updatedAt: daysFromNow(-4),
      checkIns: [{ id: 'ci-1', at: daysFromNow(-4), note: 'IA map completed and shared.' }],
    },
    {
      id: 'task-2',
      goalId: 'goal-1',
      title: 'Design onboarding empty states',
      notes: 'Match neumorphic visual language from brand kit.',
      status: 'in_progress',
      assigneeId: CURRENT_USER_ID,
      order: 2,
      dueDate: daysFromNow(2),
      createdAt: daysFromNow(-20),
      updatedAt: hoursAgo(6),
      checkIns: [{ id: 'ci-2', at: hoursAgo(6), note: 'Two variants ready for review.' }],
    },
    {
      id: 'task-3',
      goalId: 'goal-1',
      title: 'Implement billing plan toggle',
      notes: 'Blocked on Stripe test keys from finance.',
      status: 'blocked',
      assigneeId: 'user-morgan',
      order: 3,
      dueDate: daysFromNow(-1),
      createdAt: daysFromNow(-15),
      updatedAt: hoursAgo(12),
      checkIns: [],
    },
    {
      id: 'task-4',
      goalId: 'goal-1',
      title: 'Write release notes draft',
      notes: '',
      status: 'pending',
      assigneeId: CURRENT_USER_ID,
      order: 4,
      dueDate: daysFromNow(10),
      createdAt: daysFromNow(-10),
      updatedAt: daysFromNow(-10),
      checkIns: [],
    },
    {
      id: 'task-5',
      goalId: 'goal-2',
      title: 'Define blocked-task escalation rules',
      notes: 'Need help validating thresholds with leads.',
      status: 'need_help',
      assigneeId: CURRENT_USER_ID,
      order: 1,
      dueDate: daysFromNow(1),
      createdAt: daysFromNow(-12),
      updatedAt: hoursAgo(8),
      checkIns: [{ id: 'ci-3', at: hoursAgo(8), note: 'Drafted rules — need Lead sign-off.' }],
    },
    {
      id: 'task-6',
      goalId: 'goal-2',
      title: 'Configure daily ping template',
      notes: 'Friendly & casual tone per workspace settings.',
      status: 'in_progress',
      assigneeId: 'user-jordan',
      order: 2,
      dueDate: daysFromNow(4),
      createdAt: daysFromNow(-9),
      updatedAt: hoursAgo(3),
      checkIns: [],
    },
    {
      id: 'task-7',
      goalId: 'goal-3',
      title: 'Collect availability from all members',
      notes: '',
      status: 'pending',
      assigneeId: 'user-casey',
      order: 1,
      dueDate: daysFromNow(7),
      createdAt: daysFromNow(-5),
      updatedAt: daysFromNow(-5),
      checkIns: [],
    },
    {
      id: 'task-8',
      goalId: 'goal-3',
      title: 'Book workshop slot and send invites',
      notes: 'Prefer Tuesday/Thursday afternoons.',
      status: 'pending',
      assigneeId: CURRENT_USER_ID,
      order: 2,
      dueDate: daysFromNow(12),
      createdAt: daysFromNow(-4),
      updatedAt: daysFromNow(-4),
      checkIns: [],
    },
  ]

  const updates = [
    {
      id: 'upd-1',
      type: 'task_status',
      entityType: 'task',
      entityId: 'task-2',
      actorId: CURRENT_USER_ID,
      message: 'Alex moved “Design onboarding empty states” to In Progress',
      createdAt: hoursAgo(6),
    },
    {
      id: 'upd-2',
      type: 'task_blocked',
      entityType: 'task',
      entityId: 'task-3',
      actorId: 'user-morgan',
      message: 'Morgan marked “Implement billing plan toggle” as Blocked',
      createdAt: hoursAgo(12),
    },
    {
      id: 'upd-3',
      type: 'goal_progress',
      entityType: 'goal',
      entityId: 'goal-1',
      actorId: 'agent-orbit',
      message: 'Orbit Agent updated progress on Launch Q2 product refresh to 62%',
      createdAt: hoursAgo(2),
    },
    {
      id: 'upd-4',
      type: 'check_in',
      entityType: 'task',
      entityId: 'task-5',
      actorId: CURRENT_USER_ID,
      message: 'Alex checked in on escalation rules — needs Lead sign-off',
      createdAt: hoursAgo(8),
    },
    {
      id: 'upd-5',
      type: 'agent_action',
      entityType: 'agent',
      entityId: 'agent-orbit',
      actorId: 'agent-orbit',
      message: 'Orbit Agent planned: Check in with team on blocked tasks',
      createdAt: hoursAgo(1),
    },
    {
      id: 'upd-6',
      type: 'task_assigned',
      entityType: 'task',
      entityId: 'task-1',
      actorId: 'agent-orbit',
      message: 'Orbit Agent assigned Sam Chen to “Audit current dashboard IA”',
      createdAt: hoursAgo(14),
    },
    {
      id: 'upd-7',
      type: 'tasks_generated',
      entityType: 'goal',
      entityId: 'goal-2',
      actorId: 'agent-orbit',
      message: 'Orbit Agent generated 6 tasks for Stabilize agent check-in cadence',
      createdAt: hoursAgo(18),
    },
    {
      id: 'upd-8',
      type: 'status_change',
      entityType: 'task',
      entityId: 'task-7',
      actorId: 'user-jordan',
      message: 'Jordan moved “Draft capacity spreadsheet” to Done',
      createdAt: hoursAgo(22),
    },
    {
      id: 'upd-9',
      type: 'agent_action',
      entityType: 'agent',
      entityId: 'agent-pulse',
      actorId: 'agent-pulse',
      message: 'Pulse Agent sent morning digests to 4 teammates',
      createdAt: hoursAgo(26),
    },
    {
      id: 'upd-10',
      type: 'check_in',
      entityType: 'task',
      entityId: 'task-2',
      actorId: 'user-sam',
      message: 'Sam checked in — empty states waiting on design review',
      createdAt: hoursAgo(30),
    },
    {
      id: 'upd-11',
      type: 'goal_progress',
      entityType: 'goal',
      entityId: 'goal-3',
      actorId: 'agent-orbit',
      message: 'Orbit Agent updated progress on Team capacity planning workshop to 15%',
      createdAt: hoursAgo(34),
    },
    {
      id: 'upd-12',
      type: 'status_change',
      entityType: 'task',
      entityId: 'task-4',
      actorId: CURRENT_USER_ID,
      message: 'Alex moved “Wire onboarding empty states” to In Progress',
      createdAt: hoursAgo(40),
    },
  ]

  const pings = [
    {
      id: 'ping-1',
      taskId: 'task-3',
      assigneeId: 'user-morgan',
      message: 'Still blocked on Stripe keys — any update from finance?',
      status: 'sent',
      createdAt: hoursAgo(4),
    },
    {
      id: 'ping-2',
      taskId: 'task-5',
      assigneeId: CURRENT_USER_ID,
      message: 'Quick check-in: ready for Lead review on escalation rules?',
      status: 'pending',
      createdAt: hoursAgo(1),
    },
  ]

  const agents = [
    {
      id: 'agent-orbit',
      name: 'Orbit Agent',
      role: 'Project co-pilot',
      status: 'active',
      tone: 'Friendly & casual',
      nextPlannedAction: 'Check in with team on blocked tasks',
      avatarTone: 'lavender',
    },
    {
      id: 'agent-pulse',
      name: 'Pulse Agent',
      role: 'Check-in specialist',
      status: 'active',
      tone: 'Friendly & casual',
      nextPlannedAction: 'Send daily digests at 09:00',
      avatarTone: 'dustyblue',
    },
  ]

  const agent_activity = [
    {
      id: 'aa-1',
      agentId: 'agent-orbit',
      action: 'planned_check_in',
      summary: 'Next Planned Action: Check in with team on blocked tasks',
      createdAt: hoursAgo(1),
    },
    {
      id: 'aa-2',
      agentId: 'agent-orbit',
      action: 'progress_sync',
      summary: 'Synced goal progress for Launch Q2 product refresh',
      createdAt: hoursAgo(2),
    },
    {
      id: 'aa-3',
      agentId: 'agent-pulse',
      action: 'ping_drafted',
      summary: 'Drafted ping for Morgan on blocked billing task',
      createdAt: hoursAgo(4),
    },
    {
      id: 'aa-4',
      agentId: 'agent-pulse',
      action: 'digest',
      summary: 'Prepared morning digest for My Team',
      createdAt: hoursAgo(18),
    },
  ]

  const settings = {
    workspaceName: 'My Team',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    pingFrequency: 'Once daily',
    aiTone: 'Friendly & casual',
    onboardingComplete: true,
  }

  return {
    version: SEED_VERSION,
    members,
    goals,
    tasks,
    updates,
    pings,
    agents,
    agent_activity,
    settings,
  }
}
