/** Map Supabase snake_case rows ↔ Orbital camelCase UI models */

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export { uid }

export function mapMember(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    avatar: row.avatar ?? null,
    joinedAt: row.joined_at ?? row.joinedAt,
    authUserId: row.auth_user_id ?? null,
  }
}

export function memberToRow(payload) {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role ?? 'member',
    status: payload.status ?? 'active',
    avatar: payload.avatar ?? null,
    joined_at: payload.joinedAt ?? new Date().toISOString(),
    auth_user_id: payload.authUserId ?? null,
    updated_at: new Date().toISOString(),
  }
}

export function mapGoal(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status ?? 'active',
    progress: Number(row.progress ?? 0),
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? null,
    dueDate: row.target_date ?? row.due_date ?? null,
    clarifyingAnswers: row.clarifying_questions ?? row.clarifyingAnswers ?? {},
    aiContext: row.ai_context ?? null,
    createdAt: row.created_date ?? row.created_at,
    updatedAt: row.updated_date ?? row.updated_at,
  }
}

export function goalToRow(payload, { forCreate = false } = {}) {
  const now = new Date().toISOString()
  const row = { updated_date: now }
  if (payload.title !== undefined) row.title = payload.title
  if (payload.description !== undefined) row.description = payload.description
  if (payload.status !== undefined) row.status = payload.status
  if (payload.progress !== undefined) row.progress = payload.progress
  if (payload.ownerId !== undefined) row.owner_id = payload.ownerId
  if (payload.ownerName !== undefined) row.owner_name = payload.ownerName
  if (payload.dueDate !== undefined) row.target_date = payload.dueDate
  if (payload.clarifyingAnswers !== undefined) {
    row.clarifying_questions = payload.clarifyingAnswers
  }
  if (payload.aiContext !== undefined) row.ai_context = payload.aiContext
  if (forCreate) {
    row.id = payload.id || uid('goal')
    row.created_date = now
    row.title = payload.title
    row.description = payload.description ?? ''
    row.status = payload.status ?? 'active'
    row.progress = payload.progress ?? 0
    row.owner_id = payload.ownerId ?? null
    row.target_date = payload.dueDate ?? null
    row.clarifying_questions = payload.clarifyingAnswers ?? {}
    if (payload.createdById) row.created_by_id = payload.createdById
  }
  return row
}

export function mapTask(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? row.description ?? '',
    description: row.description ?? '',
    goalId: row.goal_id,
    goalTitle: row.goal_title ?? null,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name ?? null,
    assigneeEmail: row.assignee_email ?? null,
    status: row.status ?? 'pending',
    order: row.order_index ?? 0,
    dueDate: row.deadline ?? null,
    checkIns: Array.isArray(row.check_ins) ? row.check_ins : [],
    estimatedHours: row.estimated_hours ?? null,
    createdByAi: Boolean(row.created_by_ai),
    createdAt: row.created_date ?? row.created_at,
    updatedAt: row.updated_date ?? row.updated_at,
  }
}

export function taskToRow(payload, { forCreate = false } = {}) {
  const now = new Date().toISOString()
  const row = { updated_date: now }
  if (payload.title !== undefined) row.title = payload.title
  if (payload.description !== undefined || payload.notes !== undefined) {
    row.description = payload.description ?? payload.notes ?? ''
    row.notes = payload.notes ?? payload.description ?? ''
  }
  if (payload.goalId !== undefined) row.goal_id = payload.goalId
  if (payload.goalTitle !== undefined) row.goal_title = payload.goalTitle
  if (payload.assigneeId !== undefined) row.assignee_id = payload.assigneeId
  if (payload.assigneeName !== undefined) row.assignee_name = payload.assigneeName
  if (payload.assigneeEmail !== undefined) row.assignee_email = payload.assigneeEmail
  if (payload.dueDate !== undefined) row.deadline = payload.dueDate
  if (payload.status !== undefined) row.status = payload.status
  if (payload.order !== undefined) row.order_index = payload.order
  if (payload.checkIns !== undefined) row.check_ins = payload.checkIns
  if (payload.estimatedHours !== undefined) row.estimated_hours = payload.estimatedHours
  if (payload.createdByAi !== undefined) row.created_by_ai = payload.createdByAi
  if (forCreate) {
    row.id = payload.id || uid('task')
    row.created_date = now
    row.title = payload.title
    row.description = payload.description ?? payload.notes ?? ''
    row.notes = payload.notes ?? payload.description ?? ''
    row.goal_id = payload.goalId ?? null
    row.assignee_id = payload.assigneeId ?? null
    row.deadline = payload.dueDate ?? null
    row.status = payload.status ?? 'pending'
    row.order_index = payload.order ?? 0
    row.check_ins = payload.checkIns ?? []
    row.created_by_ai = payload.createdByAi ?? false
    if (payload.createdById) row.created_by_id = payload.createdById
  }
  return row
}

export function mapUpdate(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type ?? 'status_change',
    entityType: row.entity_type ?? (row.task_id ? 'task' : 'update'),
    entityId: row.entity_id ?? row.task_id ?? null,
    actorId: row.actor_id ?? row.user_id ?? null,
    actorName: row.user_name ?? null,
    taskId: row.task_id ?? null,
    taskTitle: row.task_title ?? null,
    status: row.status ?? null,
    message: row.message ?? '',
    createdAt: row.created_date ?? row.created_at,
    updatedAt: row.updated_date ?? row.updated_at,
  }
}

export function updateToRow(payload, { forCreate = false } = {}) {
  const now = new Date().toISOString()
  const row = {
    type: payload.type ?? null,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    actor_id: payload.actorId ?? null,
    task_id: payload.taskId ?? (payload.entityType === 'task' ? payload.entityId : null),
    task_title: payload.taskTitle ?? null,
    user_id: payload.actorId ?? payload.userId ?? null,
    user_name: payload.actorName ?? payload.userName ?? null,
    status: payload.status ?? null,
    message: payload.message ?? '',
    updated_date: now,
  }
  if (forCreate) {
    row.id = payload.id || uid('upd')
    row.created_date = now
    if (payload.createdById) row.created_by_id = payload.createdById
  }
  return row
}

export function mapAgent(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    instructions: row.instructions ?? '',
    role: row.role ?? row.description ?? 'Agent',
    status: row.status ?? 'active',
    tone: row.tone ?? 'Friendly & casual',
    nextPlannedAction: row.next_planned_action ?? null,
    avatarTone: row.avatar_tone ?? 'lavender',
    createdAt: row.created_date,
    updatedAt: row.updated_date,
  }
}

export function mapAgentActivity(row) {
  if (!row) return null
  return {
    id: row.id,
    agentId: row.agent_id ?? null,
    action: row.action ?? row.action_type ?? null,
    summary: row.summary ?? row.title ?? row.description ?? '',
    title: row.title ?? null,
    description: row.description ?? null,
    relatedGoalId: row.related_goal_id ?? null,
    relatedTaskId: row.related_task_id ?? null,
    relatedUserId: row.related_user_id ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_date ?? row.created_at,
  }
}

export function mapPing(row) {
  if (!row) return null
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title ?? null,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name ?? null,
    message: row.message ?? '',
    status: row.status ?? 'pending',
    response: row.response ?? null,
    respondedAt: row.responded_at ?? null,
    createdAt: row.created_date,
    updatedAt: row.updated_date,
  }
}

export function mapSettings(row) {
  if (!row) {
    return {
      workspaceName: 'My Team',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      pingFrequency: 'Once daily',
      aiTone: 'Friendly & casual',
      onboardingComplete: false,
    }
  }
  return {
    workspaceName: row.workspace_name,
    workingHoursStart: row.working_hours_start,
    workingHoursEnd: row.working_hours_end,
    pingFrequency: row.ping_frequency,
    aiTone: row.ai_tone,
    onboardingComplete: Boolean(row.onboarding_complete),
  }
}

export function settingsToRow(patch) {
  const row = { updated_at: new Date().toISOString() }
  if (patch.workspaceName !== undefined) row.workspace_name = patch.workspaceName
  if (patch.workingHoursStart !== undefined) row.working_hours_start = patch.workingHoursStart
  if (patch.workingHoursEnd !== undefined) row.working_hours_end = patch.workingHoursEnd
  if (patch.pingFrequency !== undefined) row.ping_frequency = patch.pingFrequency
  if (patch.aiTone !== undefined) row.ai_tone = patch.aiTone
  if (patch.onboardingComplete !== undefined) row.onboarding_complete = patch.onboardingComplete
  return row
}
