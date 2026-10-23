import { supabase } from '@/lib/supabase'
import {
  mapAgent,
  mapAgentActivity,
  mapGoal,
  mapMember,
  mapPing,
  mapSettings,
  mapTask,
  mapUpdate,
  mapWorkspace,
  mapWorkspaceMember,
  memberToRow,
  goalToRow,
  taskToRow,
  updateToRow,
  settingsToRow,
  workspaceToSettings,
  uid,
} from '@/api/mappers'
import { getActiveWorkspaceId } from '@/lib/workspaceStore'
import { normalizeEmail, validateInviteInput } from '@/lib/validation'
import {
  previewAgentActivity,
  previewAgents,
  previewGoal,
  previewGoals,
  previewMembers,
  previewPings,
  previewSettings,
  previewTasks,
  previewUpdates,
} from '@/api/preview'

/** Alex = empty demo. Sam = rich localStorage-style seed. */
const EMPTY_DEMO_MEMBER_ID = 'user-alex'
const RICH_DEMO_MEMBER_ID = 'user-sam'
const RICH_DEMO_GOAL_IDS = new Set(['goal-1', 'goal-2', 'goal-3'])

/** Prevents StrictMode / parallel refresh from creating two personal workspaces. */
const personalWorkspaceBootstrapInflight = new Map()

function throwIfError(error, fallback = 'Request failed') {
  if (!error) return
  throw new Error(error.message || fallback)
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  return data.user
}

async function currentMember() {
  const authUser = await requireUser().catch(() => null)
  if (!authUser) return null
  return resolveMemberForAuthUser(authUser)
}

async function isLoggedIn() {
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session?.user)
}

function scopeGoals(goals, memberId) {
  if (!memberId) return goals
  if (memberId === EMPTY_DEMO_MEMBER_ID) {
    return goals.filter((g) => g.ownerId === EMPTY_DEMO_MEMBER_ID)
  }
  if (memberId === RICH_DEMO_MEMBER_ID) {
    return goals.filter((g) => g.ownerId === RICH_DEMO_MEMBER_ID)
  }
  return goals
}

function scopeTasks(tasks, memberId) {
  if (!memberId) return tasks
  if (memberId === EMPTY_DEMO_MEMBER_ID) {
    return tasks.filter((t) => t.assigneeId === EMPTY_DEMO_MEMBER_ID)
  }
  if (memberId === RICH_DEMO_MEMBER_ID) {
    return tasks.filter(
      (t) =>
        t.assigneeId === RICH_DEMO_MEMBER_ID || RICH_DEMO_GOAL_IDS.has(t.goalId),
    )
  }
  return tasks
}

function scopeUpdates(updates, memberId) {
  if (!memberId) return updates
  if (memberId === EMPTY_DEMO_MEMBER_ID) {
    return updates.filter((u) => u.actorId === EMPTY_DEMO_MEMBER_ID)
  }
  if (memberId === RICH_DEMO_MEMBER_ID) {
    return updates
  }
  return updates
}

function scopeAgentActivity(rows, memberId) {
  if (memberId === EMPTY_DEMO_MEMBER_ID) return []
  return rows
}

async function resolveMemberForAuthUser(authUser) {
  if (!authUser) return null
  const email = (authUser.email || '').toLowerCase()

  const byAuth = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()
  if (byAuth.data) {
    const profile = mapMember(byAuth.data)
    await acceptPendingWorkspaceInvites(profile)
    return profile
  }

  if (email) {
    const byEmail = await supabase
      .from('members')
      .select('*')
      .ilike('email', email)
      .maybeSingle()
    if (byEmail.data) {
      const linked = await supabase
        .from('members')
        .update({
          auth_user_id: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', byEmail.data.id)
        .select('*')
        .single()
      const profile = mapMember(linked.data || byEmail.data)
      await acceptPendingWorkspaceInvites(profile)
      return profile
    }
  }

  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    (email ? email.split('@')[0] : 'Member')

  // Profile only — workspace role comes from workspace_members
  const row = memberToRow({
    id: uid('user'),
    name,
    email: email || `${authUser.id}@users.local`,
    role: 'member',
    status: 'active',
    authUserId: authUser.id,
    joinedAt: new Date().toISOString(),
  })

  const created = await supabase.from('members').insert(row).select('*').single()
  throwIfError(created.error, 'Could not create member profile')
  const profile = mapMember(created.data)
  await acceptPendingWorkspaceInvites(profile)
  return profile
}

/** When someone signs in, activate any pending invites that match their email. */
async function acceptPendingWorkspaceInvites(member) {
  const email = normalizeEmail(member?.email)
  if (!email || !member?.id) return

  const { data: pending, error } = await supabase
    .from('workspace_members')
    .select('id')
    .ilike('email', email)
    .eq('status', 'invited')
  if (error || !pending?.length) return

  const now = new Date().toISOString()
  await supabase
    .from('workspace_members')
    .update({
      status: 'active',
      user_id: member.id,
      full_name: member.name || email.split('@')[0],
      updated_date: now,
    })
    .ilike('email', email)
    .eq('status', 'invited')
}

/** Recalculate goal.progress from its tasks (done / total). */
async function syncGoalProgress(goalId) {
  if (!goalId) return null

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('goal_id', goalId)
  throwIfError(error, 'Failed to load tasks for progress')

  const list = tasks || []
  const progress =
    list.length === 0
      ? 0
      : Math.round((list.filter((t) => t.status === 'done').length / list.length) * 100)

  const { data: goal, error: goalErr } = await supabase
    .from('goals')
    .select('status')
    .eq('id', goalId)
    .maybeSingle()
  throwIfError(goalErr, 'Failed to load goal for progress')

  const patch = {
    progress,
    updated_date: new Date().toISOString(),
  }
  if (progress >= 100 && goal?.status !== 'completed') {
    patch.status = 'completed'
  } else if (progress < 100 && goal?.status === 'completed') {
    patch.status = 'active'
  }

  const { data, error: updateErr } = await supabase
    .from('goals')
    .update(patch)
    .eq('id', goalId)
    .select('*')
    .single()
  throwIfError(updateErr, 'Failed to update goal progress')
  return mapGoal(data)
}

const WORKSPACE_SCOPED = new Set([
  'goals',
  'tasks',
  'updates',
  'pings',
  'agents',
  'agent_activity',
])

function requireWorkspaceId(explicit) {
  const id = explicit || getActiveWorkspaceId()
  if (!id) throw new Error('No active workspace selected')
  return id
}

function collection(table, { mapRow, toRow, filterMap = {}, previewList, previewGet }) {
  const scoped = WORKSPACE_SCOPED.has(table)
  return {
    async list(filter = {}) {
      if (!(await isLoggedIn())) {
        return typeof previewList === 'function' ? previewList(filter) : []
      }
      let query = supabase.from(table).select('*')
      if (scoped) {
        const ws = filter.workspaceId || getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
      }
      Object.entries(filter).forEach(([key, value]) => {
        if (key === 'workspaceId') return
        if (value === undefined || value === null || value === '') return
        const column = filterMap[key] || key
        query = query.eq(column, value)
      })
      const { data, error } = await query
      throwIfError(error, `Failed to list ${table}`)
      return (data || []).map(mapRow)
    },

    async get(id) {
      if (!(await isLoggedIn())) {
        return typeof previewGet === 'function' ? previewGet(id) : null
      }
      let query = supabase.from(table).select('*').eq('id', id)
      if (scoped) {
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
      }
      const { data, error } = await query.maybeSingle()
      throwIfError(error, `Failed to get ${table}`)
      return mapRow(data)
    },

    async create(payload) {
      if (!(await isLoggedIn())) return null
      const authUser = await requireUser()
      const withWs =
        scoped && !payload.workspaceId
          ? { ...payload, workspaceId: requireWorkspaceId() }
          : payload
      const row = toRow(
        { ...withWs, createdById: authUser.id },
        { forCreate: true },
      )
      const { data, error } = await supabase.from(table).insert(row).select('*').single()
      throwIfError(error, `Failed to create ${table}`)
      return mapRow(data)
    },

    async update(id, patch) {
      if (!(await isLoggedIn())) return null
      const row = toRow(patch, { forCreate: false })
      let query = supabase.from(table).update(row).eq('id', id)
      if (scoped) {
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
      }
      const { data, error } = await query.select('*').single()
      throwIfError(error, `Failed to update ${table}`)
      return mapRow(data)
    },

    async remove(id) {
      if (!(await isLoggedIn())) return { ok: true }
      let query = supabase.from(table).delete().eq('id', id)
      if (scoped) {
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
      }
      const { error } = await query
      throwIfError(error, `Failed to delete ${table}`)
      return { ok: true }
    },
  }
}

export const api = {
  auth: {
    /**
     * Email + password (no email send — avoids OTP rate limits).
     * Optional OTP helpers kept for later if you enable email codes again.
     */
    async login({ email, password }) {
      if (!email) throw new Error('Email is required')
      if (!password) throw new Error('Password is required')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })
      throwIfError(error, 'Login failed')

      const user = await resolveMemberForAuthUser(data.user)
      return {
        requiresOtp: false,
        user,
        session: data.session,
      }
    },

    async verifyOtp({ challengeId, code, email }) {
      const targetEmail = (email || challengeId || '').toLowerCase()
      if (!targetEmail) throw new Error('Email is required')
      if (!code) throw new Error('Code is required')

      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: String(code).trim(),
        type: 'email',
      })
      throwIfError(error, 'Incorrect or expired code')

      const user = await resolveMemberForAuthUser(data.user)
      return {
        user,
        session: data.session,
      }
    },

    async requestEmailOtp({ email }) {
      if (!email) throw new Error('Email is required')
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: { shouldCreateUser: true },
      })
      throwIfError(error, 'Could not send code')
      return {
        requiresOtp: true,
        challengeId: email.toLowerCase(),
        email: email.toLowerCase(),
        message: 'Check your email for a 6-digit code.',
      }
    },

    async logout() {
      const { error } = await supabase.auth.signOut()
      throwIfError(error, 'Logout failed')
      return { ok: true }
    },

    async getSession() {
      const { data, error } = await supabase.auth.getSession()
      throwIfError(error)
      if (!data.session?.user) return null
      const user = await resolveMemberForAuthUser(data.session.user)
      return { session: data.session, user }
    },

    async getCurrentUser() {
      const result = await api.auth.getSession()
      return result?.user ?? null
    },

    async demoLoginAs({ email, password, name }) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
          throw new Error(
            `Email not confirmed for ${email}. Run: update auth.users set email_confirmed_at = now() where email = '${email}';`,
          )
        }
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          throw new Error(
            `Create Auth user ${email} / ${password} (Auto Confirm on), then try again.`,
          )
        }
        throw new Error(error.message || 'Demo login failed')
      }

      const user = await resolveMemberForAuthUser(data.user)
      if (name && user && !user.name) {
        user.name = name
      }
      return { user, session: data.session }
    },

    /** Empty workspace demo */
    async demoLogin() {
      return api.auth.demoLoginAs({
        email: 'alex@orbital.app',
        password: 'orbital-demo',
        name: 'Alex Rivera',
      })
    },

    /** Rich seed-data demo (old localStorage content) */
    async demoLoginSam() {
      return api.auth.demoLoginAs({
        email: 'sam@orbital.app',
        password: 'orbital-demo',
        name: 'Sam Chen',
      })
    },
  },

  data: {
    goals: {
      ...collection('goals', {
        mapRow: mapGoal,
        toRow: goalToRow,
        filterMap: { ownerId: 'owner_id' },
        previewList: () => previewGoals(),
        previewGet: (id) => previewGoal(id),
      }),
      async list(filter = {}) {
        if (!(await isLoggedIn())) return previewGoals()
        const base = collection('goals', {
          mapRow: mapGoal,
          toRow: goalToRow,
          filterMap: { ownerId: 'owner_id' },
        })
        const rows = await base.list(filter)
        const member = await currentMember().catch(() => null)
        return scopeGoals(rows, member?.id)
      },
      async get(id) {
        if (!(await isLoggedIn())) return previewGoal(id)
        const { data, error } = await supabase.from('goals').select('*').eq('id', id).maybeSingle()
        throwIfError(error)
        return mapGoal(data)
      },
    },
    tasks: {
      ...collection('tasks', {
        mapRow: mapTask,
        toRow: taskToRow,
        filterMap: { goalId: 'goal_id', assigneeId: 'assignee_id' },
        previewList: (filter) => previewTasks(filter),
        previewGet: (id) => previewTasks().find((t) => t.id === id) ?? null,
      }),
      async list(filter = {}) {
        if (!(await isLoggedIn())) return previewTasks(filter)
        const base = collection('tasks', {
          mapRow: mapTask,
          toRow: taskToRow,
          filterMap: { goalId: 'goal_id', assigneeId: 'assignee_id' },
        })
        const rows = await base.list(filter)
        const member = await currentMember().catch(() => null)
        return scopeTasks(rows, member?.id)
      },
      async create(payload) {
        const base = collection('tasks', {
          mapRow: mapTask,
          toRow: taskToRow,
          filterMap: { goalId: 'goal_id', assigneeId: 'assignee_id' },
        })
        const task = await base.create(payload)
        if (task?.goalId) await syncGoalProgress(task.goalId)
        return task
      },
      async update(id, patch) {
        const base = collection('tasks', {
          mapRow: mapTask,
          toRow: taskToRow,
          filterMap: { goalId: 'goal_id', assigneeId: 'assignee_id' },
        })
        const task = await base.update(id, patch)
        if (task?.goalId) await syncGoalProgress(task.goalId)
        return task
      },
      async remove(id) {
        if (!(await isLoggedIn())) return { ok: true }
        const existing = await supabase
          .from('tasks')
          .select('goal_id')
          .eq('id', id)
          .maybeSingle()
        throwIfError(existing.error, 'Task not found')
        const goalId = existing.data?.goal_id
        const base = collection('tasks', {
          mapRow: mapTask,
          toRow: taskToRow,
          filterMap: { goalId: 'goal_id', assigneeId: 'assignee_id' },
        })
        const result = await base.remove(id)
        if (goalId) await syncGoalProgress(goalId)
        return result
      },
    },
    updates: {
      ...collection('updates', {
        mapRow: mapUpdate,
        toRow: updateToRow,
        filterMap: { actorId: 'actor_id', entityId: 'entity_id', taskId: 'task_id' },
        previewList: () => previewUpdates(),
      }),
      async list(filter = {}) {
        if (!(await isLoggedIn())) return previewUpdates()
        const base = collection('updates', {
          mapRow: mapUpdate,
          toRow: updateToRow,
          filterMap: { actorId: 'actor_id', entityId: 'entity_id', taskId: 'task_id' },
        })
        const rows = await base.list(filter)
        const member = await currentMember().catch(() => null)
        return scopeUpdates(rows, member?.id)
      },
    },
    pings: {
      async list(filter = {}) {
        if (!(await isLoggedIn())) return previewPings()
        let query = supabase.from('pings').select('*')
        const ws = filter.workspaceId || getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
        if (filter.assigneeId) query = query.eq('assignee_id', filter.assigneeId)
        if (filter.taskId) query = query.eq('task_id', filter.taskId)
        const { data, error } = await query
        throwIfError(error, 'Failed to list pings')
        let rows = (data || []).map(mapPing)
        const member = await currentMember().catch(() => null)
        if (member?.id === EMPTY_DEMO_MEMBER_ID) {
          rows = rows.filter((p) => p.assigneeId === EMPTY_DEMO_MEMBER_ID)
        }
        return rows
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewPings().find((p) => p.id === id) ?? null
        }
        const { data, error } = await supabase.from('pings').select('*').eq('id', id).maybeSingle()
        throwIfError(error)
        return mapPing(data)
      },
      async create() {
        if (!(await isLoggedIn())) return null
        throw new Error('Ping create via API not wired yet')
      },
      async update() {
        if (!(await isLoggedIn())) return null
        throw new Error('Ping update via API not wired yet')
      },
      async remove(id) {
        if (!(await isLoggedIn())) return { ok: true }
        const { error } = await supabase.from('pings').delete().eq('id', id)
        throwIfError(error)
        return { ok: true }
      },
    },
    agents: {
      async list() {
        if (!(await isLoggedIn())) return previewAgents()
        let query = supabase.from('agents').select('*')
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
        const { data, error } = await query
        throwIfError(error, 'Failed to list agents')
        return (data || []).map(mapAgent)
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewAgents().find((a) => a.id === id) ?? null
        }
        let query = supabase.from('agents').select('*').eq('id', id)
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
        const { data, error } = await query.maybeSingle()
        throwIfError(error)
        return mapAgent(data)
      },
      async create() {
        if (!(await isLoggedIn())) return null
        throw new Error('Agent create via API not wired yet')
      },
      async update() {
        if (!(await isLoggedIn())) return null
        throw new Error('Agent update via API not wired yet')
      },
      async remove() {
        if (!(await isLoggedIn())) return { ok: true }
        throw new Error('Agent remove via API not wired yet')
      },
    },
    agent_activity: {
      async list() {
        if (!(await isLoggedIn())) return previewAgentActivity()
        let query = supabase
          .from('agent_activity')
          .select('*')
          .order('created_date', { ascending: false })
        const ws = getActiveWorkspaceId()
        if (ws) query = query.eq('workspace_id', ws)
        const { data, error } = await query
        throwIfError(error, 'Failed to list agent activity')
        const rows = (data || []).map(mapAgentActivity)
        const member = await currentMember().catch(() => null)
        return scopeAgentActivity(rows, member?.id)
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewAgentActivity().find((a) => a.id === id) ?? null
        }
        const { data, error } = await supabase
          .from('agent_activity')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        throwIfError(error)
        return mapAgentActivity(data)
      },
      async create() {
        if (!(await isLoggedIn())) return null
        throw new Error('Agent activity create via API not wired yet')
      },
      async update() {
        if (!(await isLoggedIn())) return null
        throw new Error('Agent activity update via API not wired yet')
      },
      async remove() {
        if (!(await isLoggedIn())) return { ok: true }
        throw new Error('Agent activity remove via API not wired yet')
      },
    },
    members: {
      /** Active-workspace roster — only people who have joined (not pending invites). */
      async list() {
        if (!(await isLoggedIn())) return previewMembers()
        const ws = getActiveWorkspaceId()
        if (!ws) return []
        const { data, error } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', ws)
          .eq('status', 'active')
          .order('created_date', { ascending: true })
        throwIfError(error, 'Failed to list members')
        return (data || []).map(mapWorkspaceMember)
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewMembers().find((m) => m.id === id) ?? null
        }
        const ws = getActiveWorkspaceId()
        let query = supabase.from('workspace_members').select('*').eq('user_id', id)
        if (ws) query = query.eq('workspace_id', ws)
        const { data, error } = await query.maybeSingle()
        throwIfError(error)
        return mapWorkspaceMember(data)
      },
      async create(payload) {
        return api.teamAdmin.invite(payload)
      },
      async update(id, patch) {
        if (patch.role !== undefined) {
          return api.teamAdmin.updateRole(id, patch.role)
        }
        return null
      },
      async remove(id) {
        return api.teamAdmin.remove(id)
      },
    },

    async getSettings() {
      if (!(await isLoggedIn())) return previewSettings()
      const ws = getActiveWorkspaceId()
      if (ws) {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', ws)
          .maybeSingle()
        throwIfError(error, 'Failed to load settings')
        if (data) return workspaceToSettings(data)
      }
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle()
      throwIfError(error, 'Failed to load settings')
      return mapSettings(data)
    },

    async updateSettings(patch) {
      if (!(await isLoggedIn())) return null
      const ws = getActiveWorkspaceId()
      if (ws) {
        const row = { updated_date: new Date().toISOString() }
        if (patch.workspaceName !== undefined) row.name = patch.workspaceName
        if (patch.workingHoursStart !== undefined) row.working_hours_start = patch.workingHoursStart
        if (patch.workingHoursEnd !== undefined) row.working_hours_end = patch.workingHoursEnd
        if (patch.pingFrequency !== undefined) row.ping_frequency = patch.pingFrequency
        if (patch.aiTone !== undefined) row.ai_tone = patch.aiTone
        const { data, error } = await supabase
          .from('workspaces')
          .update(row)
          .eq('id', ws)
          .select('*')
          .single()
        throwIfError(error, 'Failed to update settings')
        return workspaceToSettings(data)
      }
      const row = settingsToRow(patch)
      const { data, error } = await supabase
        .from('settings')
        .update(row)
        .eq('id', 'default')
        .select('*')
        .single()
      throwIfError(error, 'Failed to update settings')
      return mapSettings(data)
    },

    async resetToSeed() {
      throw new Error(
        'resetToSeed is disabled with Supabase — use supabase/seed_demo.sql in the SQL Editor.',
      )
    },
  },

  myTasks: {
    async list(userId) {
      if (!(await isLoggedIn())) {
        return previewTasks({ assigneeId: RICH_DEMO_MEMBER_ID })
      }
      let id = userId
      if (!id) {
        const session = await api.auth.getSession()
        id = session?.user?.id
      }
      if (!id) return []
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', id)
        .order('order_index', { ascending: true })
      const ws = getActiveWorkspaceId()
      if (ws) query = query.eq('workspace_id', ws)
      const { data, error } = await query
      throwIfError(error, 'Failed to list my tasks')
      return (data || []).map(mapTask)
    },

    async updateStatus(taskId, status, note) {
      if (!(await isLoggedIn())) return null
      const session = await api.auth.getSession()
      const actorId = session?.user?.id

      const existing = await supabase.from('tasks').select('*').eq('id', taskId).single()
      throwIfError(existing.error, 'Task not found')

      const checkIns = Array.isArray(existing.data.check_ins) ? [...existing.data.check_ins] : []
      if (note) {
        checkIns.push({ id: uid('ci'), at: new Date().toISOString(), note })
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          status,
          notes: note || existing.data.notes,
          check_ins: checkIns,
          updated_date: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select('*')
        .single()
      throwIfError(error, 'Failed to update task status')

      if (task.goal_id) await syncGoalProgress(task.goal_id)

      await supabase.from('updates').insert(
        updateToRow(
          {
            type: 'task_status',
            entityType: 'task',
            entityId: taskId,
            actorId,
            taskId,
            taskTitle: task.title,
            status,
            workspaceId: task.workspace_id || getActiveWorkspaceId(),
            message: `Status updated to ${String(status).replace('_', ' ')}`,
          },
          { forCreate: true },
        ),
      )

      return mapTask(task)
    },

    async addNote(taskId, note) {
      if (!(await isLoggedIn())) return null
      const existing = await supabase.from('tasks').select('*').eq('id', taskId).single()
      throwIfError(existing.error, 'Task not found')
      const checkIns = Array.isArray(existing.data.check_ins) ? [...existing.data.check_ins] : []
      checkIns.push({ id: uid('ci'), at: new Date().toISOString(), note })
      const { data, error } = await supabase
        .from('tasks')
        .update({
          notes: note,
          check_ins: checkIns,
          updated_date: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select('*')
        .single()
      throwIfError(error, 'Failed to add note')
      return mapTask(data)
    },
  },

  workspaces: {
    async listMine() {
      if (!(await isLoggedIn())) return []
      const member = await currentMember()
      const email = (member?.email || '').toLowerCase()
      if (!email && !member?.id) return []

      let query = supabase.from('workspace_members').select('*')
      if (email) query = query.ilike('email', email)
      else query = query.eq('user_id', member.id)

      const { data: memberships, error } = await query
      throwIfError(error, 'Failed to list workspace memberships')
      if (!memberships?.length) return []

      const ids = [...new Set(memberships.map((m) => m.workspace_id).filter(Boolean))]
      const { data: spaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', ids)
      throwIfError(wsErr, 'Failed to list workspaces')

      const byId = Object.fromEntries((spaces || []).map((w) => [w.id, mapWorkspace(w)]))
      // One entry per workspace (duplicate membership rows shouldn't show twice)
      const seen = new Set()
      const list = []
      for (const m of memberships) {
        if (!m.workspace_id || seen.has(m.workspace_id)) continue
        const workspace = byId[m.workspace_id]
        if (!workspace) continue
        seen.add(m.workspace_id)
        list.push({
          ...workspace,
          role: m.role || 'member',
          membershipId: m.id,
          membershipStatus: m.status || 'active',
        })
      }
      return list
    },

    /**
     * Accidental double-bootstrap creates two "Name's Workspace" owner spaces.
     * Keep the oldest owned workspace; remove the extras for this user.
     */
    async dedupeAccidentalPersonalWorkspaces() {
      const list = await api.workspaces.listMine()
      const owned = list
        .filter((w) => w.role === 'owner')
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      if (owned.length < 2) return list

      // Group by normalized name — only collapse exact-name clones
      const byName = new Map()
      for (const w of owned) {
        const key = String(w.name || '').trim().toLowerCase()
        if (!byName.has(key)) byName.set(key, [])
        byName.get(key).push(w)
      }

      for (const group of byName.values()) {
        if (group.length < 2) continue
        const [, ...dupes] = group
        for (const dupe of dupes) {
          if (dupe.membershipId) {
            await supabase.from('workspace_members').delete().eq('id', dupe.membershipId)
          }
          // Only delete workspace if no other members remain
          const { count } = await supabase
            .from('workspace_members')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', dupe.id)
          if ((count ?? 0) === 0) {
            await supabase.from('workspaces').delete().eq('id', dupe.id)
          }
        }
      }
      return api.workspaces.listMine()
    },

    /**
     * Idempotent: if user has no memberships, create personal workspace + Owner row.
     * Concurrent callers share one in-flight promise (StrictMode / double refresh safe).
     */
    async ensurePersonalWorkspace({ name } = {}) {
      if (!(await isLoggedIn())) return []

      const member = await currentMember()
      const authUser = await requireUser()
      const email = (member?.email || authUser.email || '').toLowerCase()
      const lockKey = email || member?.id || authUser.id

      if (personalWorkspaceBootstrapInflight.has(lockKey)) {
        return personalWorkspaceBootstrapInflight.get(lockKey)
      }

      const job = (async () => {
        let existing = await api.workspaces.listMine()
        if (existing.length > 0) {
          return api.workspaces.dedupeAccidentalPersonalWorkspaces()
        }

        const fullName =
          member?.name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Owner')
        const ownerId = member?.id || uid('user')
        const wsName = (name || `${fullName}'s Workspace`).trim() || 'My Workspace'
        const now = new Date().toISOString()

        // Re-check under lock before insert (another tab may have finished)
        existing = await api.workspaces.listMine()
        if (existing.length > 0) return existing

        const workspaceId = crypto.randomUUID()
        const membershipId = crypto.randomUUID()
        const { data: workspace, error: wsErr } = await supabase
          .from('workspaces')
          .insert({
            id: workspaceId,
            name: wsName,
            owner_id: ownerId,
            owner_email: email,
            working_hours_start: '09:00',
            working_hours_end: '17:00',
            ping_frequency: 'Once daily',
            ai_tone: 'Friendly & casual',
            created_date: now,
            updated_date: now,
            created_by_id: ownerId,
          })
          .select('*')
          .single()
        throwIfError(wsErr, 'Failed to create workspace')

        const { error: memErr } = await supabase.from('workspace_members').insert({
          id: membershipId,
          workspace_id: workspace.id,
          user_id: ownerId,
          email,
          full_name: fullName,
          role: 'owner',
          status: 'active',
          created_date: now,
          updated_date: now,
          created_by_id: ownerId,
        })
        if (memErr) {
          const again = await api.workspaces.listMine()
          if (again.length) return again
          throwIfError(memErr, 'Failed to create owner membership')
        }

        return api.workspaces.listMine()
      })().finally(() => {
        personalWorkspaceBootstrapInflight.delete(lockKey)
      })

      personalWorkspaceBootstrapInflight.set(lockKey, job)
      return job
    },
  },

  teamAdmin: {
    async invite({ name, email, role = 'member' }) {
      if (!(await isLoggedIn())) return null
      const ws = requireWorkspaceId()
      const checked = validateInviteInput({ name, email, role })
      if (!checked.ok) {
        throw new Error(
          checked.errors.email || checked.errors.name || checked.errors.role || 'Invalid invite',
        )
      }
      const { name: cleanName, email: normalized, role: cleanRole } = checked.values

      const { data: existing } = await supabase
        .from('workspace_members')
        .select('id, status')
        .eq('workspace_id', ws)
        .ilike('email', normalized)
        .maybeSingle()
      if (existing?.status === 'active') {
        throw new Error('Already a member of this workspace')
      }
      if (existing?.status === 'invited') {
        throw new Error('An invite is already pending for this email')
      }

      const member = await currentMember().catch(() => null)
      const userId = uid('user')
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: ws,
          user_id: userId,
          email: normalized,
          full_name: cleanName,
          role: cleanRole,
          status: 'invited',
          created_date: now,
          updated_date: now,
          created_by_id: member?.id || null,
        })
        .select('*')
        .single()
      throwIfError(error, 'Invite failed')
      // Pending invites stay off the Team roster until the person joins (status → active)
      return mapWorkspaceMember(data)
    },

    async updateRole(memberId, role) {
      if (!(await isLoggedIn())) return null
      if (role === 'owner') throw new Error('Cannot assign Owner via role change')
      const ws = requireWorkspaceId()
      const { data: target, error: findErr } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', ws)
        .eq('user_id', memberId)
        .maybeSingle()
      throwIfError(findErr)
      if (!target) throw new Error('Member not found in this workspace')
      if (target.role === 'owner') throw new Error('Cannot change the Owner role')

      const { data, error } = await supabase
        .from('workspace_members')
        .update({ role, updated_date: new Date().toISOString() })
        .eq('id', target.id)
        .select('*')
        .single()
      throwIfError(error, 'Failed to update role')
      return mapWorkspaceMember(data)
    },

    async remove(memberId) {
      if (!(await isLoggedIn())) return { ok: true }
      const ws = requireWorkspaceId()
      const { data: target, error: findErr } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', ws)
        .eq('user_id', memberId)
        .maybeSingle()
      throwIfError(findErr)
      if (!target) return { ok: true }
      if (target.role === 'owner') throw new Error('Cannot remove the workspace Owner')
      const { error } = await supabase.from('workspace_members').delete().eq('id', target.id)
      throwIfError(error, 'Failed to remove member')
      return { ok: true }
    },
  },
}

export default api
