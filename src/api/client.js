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
  memberToRow,
  goalToRow,
  taskToRow,
  updateToRow,
  settingsToRow,
  uid,
} from '@/api/mappers'
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
  if (byAuth.data) return mapMember(byAuth.data)

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
      if (linked.data) return mapMember(linked.data)
      return mapMember(byEmail.data)
    }
  }

  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    (email ? email.split('@')[0] : 'Member')

  const row = memberToRow({
    id: uid('user'),
    name,
    email: email || `${authUser.id}@users.local`,
    role: 'lead',
    status: 'active',
    authUserId: authUser.id,
    joinedAt: new Date().toISOString(),
  })

  const created = await supabase.from('members').insert(row).select('*').single()
  throwIfError(created.error, 'Could not create member profile')
  return mapMember(created.data)
}

function collection(table, { mapRow, toRow, filterMap = {}, previewList, previewGet }) {
  return {
    async list(filter = {}) {
      if (!(await isLoggedIn())) {
        return typeof previewList === 'function' ? previewList(filter) : []
      }
      let query = supabase.from(table).select('*')
      Object.entries(filter).forEach(([key, value]) => {
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
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
      throwIfError(error, `Failed to get ${table}`)
      return mapRow(data)
    },

    async create(payload) {
      if (!(await isLoggedIn())) return null
      const authUser = await requireUser()
      const row = toRow(
        { ...payload, createdById: authUser.id },
        { forCreate: true },
      )
      const { data, error } = await supabase.from(table).insert(row).select('*').single()
      throwIfError(error, `Failed to create ${table}`)
      return mapRow(data)
    },

    async update(id, patch) {
      if (!(await isLoggedIn())) return null
      const row = toRow(patch, { forCreate: false })
      const { data, error } = await supabase
        .from(table)
        .update(row)
        .eq('id', id)
        .select('*')
        .single()
      throwIfError(error, `Failed to update ${table}`)
      return mapRow(data)
    },

    async remove(id) {
      if (!(await isLoggedIn())) return { ok: true }
      const { error } = await supabase.from(table).delete().eq('id', id)
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
        const { data, error } = await supabase.from('agents').select('*')
        throwIfError(error, 'Failed to list agents')
        return (data || []).map(mapAgent)
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewAgents().find((a) => a.id === id) ?? null
        }
        const { data, error } = await supabase.from('agents').select('*').eq('id', id).maybeSingle()
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
        const { data, error } = await supabase
          .from('agent_activity')
          .select('*')
          .order('created_date', { ascending: false })
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
      async list() {
        if (!(await isLoggedIn())) return previewMembers()
        const { data, error } = await supabase.from('members').select('*')
        throwIfError(error, 'Failed to list members')
        return (data || []).map(mapMember)
      },
      async get(id) {
        if (!(await isLoggedIn())) {
          return previewMembers().find((m) => m.id === id) ?? null
        }
        const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
        throwIfError(error)
        return mapMember(data)
      },
      async create(payload) {
        if (!(await isLoggedIn())) return null
        const row = memberToRow({ ...payload, id: payload.id || uid('user') })
        const { data, error } = await supabase.from('members').insert(row).select('*').single()
        throwIfError(error, 'Failed to create member')
        return mapMember(data)
      },
      async update(id, patch) {
        if (!(await isLoggedIn())) return null
        const row = {}
        if (patch.name !== undefined) row.name = patch.name
        if (patch.email !== undefined) row.email = patch.email
        if (patch.role !== undefined) row.role = patch.role
        if (patch.status !== undefined) row.status = patch.status
        if (patch.avatar !== undefined) row.avatar = patch.avatar
        row.updated_at = new Date().toISOString()
        const { data, error } = await supabase
          .from('members')
          .update(row)
          .eq('id', id)
          .select('*')
          .single()
        throwIfError(error, 'Failed to update member')
        return mapMember(data)
      },
      async remove(id) {
        if (!(await isLoggedIn())) return { ok: true }
        const { error } = await supabase.from('members').delete().eq('id', id)
        throwIfError(error)
        return { ok: true }
      },
    },

    async getSettings() {
      if (!(await isLoggedIn())) return previewSettings()
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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', id)
        .order('order_index', { ascending: true })
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

  teamAdmin: {
    async invite({ name, email, role = 'member' }) {
      if (!(await isLoggedIn())) return null
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .ilike('email', email)
        .maybeSingle()
      if (existing) throw new Error('Member already exists')

      const row = memberToRow({
        id: uid('user'),
        name,
        email,
        role,
        status: 'invited',
        joinedAt: new Date().toISOString(),
      })
      const { data, error } = await supabase.from('members').insert(row).select('*').single()
      throwIfError(error, 'Invite failed')
      return mapMember(data)
    },

    async updateRole(memberId, role) {
      if (!(await isLoggedIn())) return null
      const { data, error } = await supabase
        .from('members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .select('*')
        .single()
      throwIfError(error, 'Failed to update role')
      return mapMember(data)
    },

    async remove(memberId) {
      if (!(await isLoggedIn())) return { ok: true }
      const { error } = await supabase.from('members').delete().eq('id', memberId)
      throwIfError(error, 'Failed to remove member')
      return { ok: true }
    },
  },
}

export default api
