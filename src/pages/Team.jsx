import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Bot, Loader2, UserPlus } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import AiAvatar from '@/components/shared/AiAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { useWorkspace } from '@/hooks/useWorkspace'
import { canInviteMembers, canManageTeam, roleLabel, ROLES } from '@/lib/roles'
import { validateInviteInput } from '@/lib/validation'
import { cn } from '@/lib/utils'

const ROLE_STYLE = {
  owner: {
    text: 'text-[#7a5c3e]',
    chip: 'text-[#7a5c3e]',
  },
  lead: {
    text: 'text-[#5b6e8c]',
    chip: 'text-[#5b6e8c]',
  },
  member: {
    text: 'text-[#5f6b58]',
    chip: 'text-[#5f6b58]',
  },
  viewer: {
    text: 'text-[#8a7a68]',
    chip: 'text-[#8a7a68]',
  },
}

const INVITE_ROLES = [ROLES.LEAD, ROLES.MEMBER, ROLES.VIEWER]

function taskStatsForMember(tasks, member) {
  const id = member.id
  const email = (member.email || '').toLowerCase()
  const mine = tasks.filter(
    (t) =>
      t.assigneeId === id ||
      (email && (t.assigneeEmail || '').toLowerCase() === email),
  )
  return {
    total: mine.length,
    done: mine.filter((t) => t.status === 'done').length,
    active: mine.filter((t) => t.status === 'in_progress' || t.status === 'pending').length,
    blocked: mine.filter((t) => t.status === 'blocked' || t.status === 'need_help').length,
  }
}

function MemberCard({ member, isYou, canEditRole, stats, onRoleChange, rolePending }) {
  const style = ROLE_STYLE[member.role] || ROLE_STYLE.member

  return (
    <motion.article
      layout
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="neu-raised flex h-full w-full flex-col gap-4 p-5 transition-shadow duration-200 ease-out hover:shadow-neu-hover sm:p-6"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="workspace-pill flex h-12 w-12 shrink-0 items-center justify-center text-sm font-semibold text-foreground sm:h-14 sm:w-14 sm:text-base">
          {(member.name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground sm:text-lg">
            {member.name}
            {isYou ? <span className="ml-1.5 text-xs font-normal text-faint">(you)</span> : null}
          </p>
          <p className="truncate text-xs text-muted sm:text-sm">{member.email}</p>
        </div>
        <span
          className={cn(
            'workspace-pill shrink-0 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
            style.chip,
          )}
        >
          {roleLabel(member.role)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="workspace-pill px-2 py-2.5 text-center sm:px-3 sm:py-3">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-dustyblue" />
            Active
          </p>
          <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">{stats.active}</p>
        </div>
        <div className="workspace-pill px-2 py-2.5 text-center sm:px-3 sm:py-3">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            Done
          </p>
          <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">{stats.done}</p>
        </div>
        <div className="workspace-pill px-2 py-2.5 text-center sm:px-3 sm:py-3">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
            Blocked
          </p>
          <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">{stats.blocked}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(170,152,134,0.12)] pt-3">
        <p className="text-[11px] text-faint">
          {stats.total} task{stats.total === 1 ? '' : 's'} ·{' '}
          {member.status === 'active' ? 'Active' : 'Invited'}
        </p>
        {canEditRole ? (
          <div className="flex items-center gap-1">
            {rolePending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" /> : null}
            <select
              className="workspace-pill max-w-[7.5rem] cursor-pointer appearance-none bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-foreground outline-none"
              value={member.role}
              disabled={rolePending}
              onChange={(e) => onRoleChange(e.target.value)}
            >
              {INVITE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className={cn('text-[11px] font-semibold uppercase tracking-[0.1em]', style.text)}>
            {roleLabel(member.role)}
          </span>
        )}
      </div>
    </motion.article>
  )
}

function Team() {
  const { user, isAuthenticated } = useAuth()
  const { workspaceId, role: wsRole } = useWorkspace()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const effectiveRole = isAuthenticated ? wsRole : 'owner'
  const showInvite = !isAuthenticated || canInviteMembers(effectiveRole)
  const showManage = !isAuthenticated || canManageTeam(effectiveRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES.MEMBER)
  const [inviteErrors, setInviteErrors] = useState({})
  const ready = !isAuthenticated || Boolean(workspaceId)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => api.data.members.list(),
    enabled: ready,
  })
  const { data: agents = [] } = useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: () => api.data.agents.list(),
    enabled: ready,
  })
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: () => api.data.tasks.list(),
    enabled: ready,
  })

  const inviteMutation = useMutation({
    mutationFn: (payload) => api.teamAdmin.invite(payload),
    onSuccess: (data) => {
      if (!data) return
      // Roster only shows joined members — don't expect a new card yet
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Invite sent... they’ll appear on Team after they join.')
      setInviteOpen(false)
      setName('')
      setEmail('')
      setRole(ROLES.MEMBER)
      setInviteErrors({})
    },
    onError: (err) => toast.error(err.message || 'Invite failed'),
  })

  const submitInvite = () => {
    const checked = validateInviteInput({ name, email, role })
    setInviteErrors(checked.errors)
    if (!checked.ok) {
      toast.error(
        checked.errors.email || checked.errors.name || checked.errors.role || 'Check the form',
      )
      return
    }
    inviteMutation.mutate(checked.values)
  }

  const roleMutation = useMutation({
    mutationFn: ({ memberId, nextRole }) => api.teamAdmin.updateRole(memberId, nextRole),
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Role updated')
    },
    onError: (err) => toast.error(err.message || 'Could not update role'),
  })

  const statsByMember = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      map[m.id] = taskStatsForMember(tasks, m)
    })
    return map
  }, [members, tasks])

  if (isLoading) return <PageSkeleton cards={4} />

  const memberGridClass =
    members.length <= 1
      ? 'grid grid-cols-1 gap-4'
      : members.length === 2
        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
        : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'

  const agentGridClass =
    agents.length <= 1
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 gap-4 md:grid-cols-2'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="Team"
        description="People and AI agents collaborating in this workspace."
        className="mb-0 sm:mb-0"
        actions={
          showInvite ? (
            <Button onClick={guard(() => setInviteOpen(true))}>
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          ) : null
        }
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Members
          </h2>
          <span className="text-[11px] text-faint">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Invite teammates to this workspace."
            className="min-h-[200px] w-full"
            action={
              showInvite ? (
                <Button onClick={guard(() => setInviteOpen(true))}>
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={memberGridClass}>
            {members.map((member) => {
              const isYou =
                member.id === user?.id ||
                (member.email &&
                  user?.email &&
                  member.email.toLowerCase() === user.email.toLowerCase())
              const canEditRole = showManage && !isYou && member.role !== ROLES.OWNER
              return (
                <MemberCard
                  key={member.membershipId || member.id}
                  member={member}
                  isYou={isYou}
                  canEditRole={canEditRole}
                  stats={statsByMember[member.id] || { total: 0, done: 0, active: 0, blocked: 0 }}
                  rolePending={
                    roleMutation.isPending && roleMutation.variables?.memberId === member.id
                  }
                  onRoleChange={guard((nextRole) =>
                    roleMutation.mutate({ memberId: member.id, nextRole }),
                  )}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            AI Agents
          </h2>
          <span className="text-[11px] text-faint">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        {agents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents yet"
            description="Orbit agents will show up here when configured for this workspace."
            className="min-h-[200px] w-full"
          />
        ) : (
          <div className={agentGridClass}>
            {agents.map((agent) => (
              <motion.article
                key={agent.id}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="neu-raised flex h-full gap-4 p-5 transition-shadow duration-200 ease-out hover:shadow-neu-hover"
              >
                <div className="workspace-pill flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden p-1">
                  <AiAvatar name={agent.name} tone={agent.avatarTone} size="lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted">{agent.role}</p>
                  <div className="workspace-pill mt-3 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                      Next
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {agent.nextPlannedAction || 'Standing by'}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-faint">Tone · {agent.tone}</p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open)
          if (!open) setInviteErrors({})
        }}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader className="mb-5 pr-10">
            <DialogTitle className="text-[20px] font-semibold tracking-tight text-foreground">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Name
              </Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (inviteErrors.name) setInviteErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder="Jordan Lee"
                aria-invalid={Boolean(inviteErrors.name)}
                className={cn(
                  'h-11 rounded-[10px] border-0 bg-[#ebe7e2] shadow-none focus-visible:ring-0',
                  inviteErrors.name && 'ring-2 ring-terracotta/50',
                )}
                style={{
                  boxShadow:
                    'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                }}
              />
              {inviteErrors.name ? (
                <p className="text-[12px] text-terracotta">{inviteErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (inviteErrors.email) setInviteErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="jordan@company.com"
                aria-invalid={Boolean(inviteErrors.email)}
                className={cn(
                  'h-11 rounded-[10px] border-0 bg-[#ebe7e2] shadow-none focus-visible:ring-0',
                  inviteErrors.email && 'ring-2 ring-terracotta/50',
                )}
                style={{
                  boxShadow:
                    'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                }}
              />
              {inviteErrors.email ? (
                <p className="text-[12px] text-terracotta">{inviteErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Role
              </Label>
              <div className="grid grid-cols-3 gap-2.5">
                {INVITE_ROLES.map((r) => {
                  const selected = role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        'h-11 rounded-[10px] text-center text-[13px] font-medium transition',
                        selected
                          ? 'bg-[#ebe7e2] font-semibold text-foreground'
                          : 'bg-[#eeeae6] text-muted shadow-neu-out-sm hover:text-foreground',
                      )}
                      style={
                        selected
                          ? {
                              boxShadow:
                                'inset -3px -3px 6px rgba(255,250,244,0.68), inset 3px 3px 6px rgba(160,143,126,0.24)',
                            }
                          : undefined
                      }
                    >
                      {roleLabel(r)}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-faint">
              They won’t show on Team until they sign up / log in with that email.
            </p>
          </div>
          <DialogFooter className="mt-7 gap-2.5">
            <Button
              variant="neu"
              className="h-11 rounded-[12px] bg-[#eeeae6] px-5 shadow-neu-out-sm"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              className="h-11 rounded-[12px] bg-[#3a3a3a] px-5 text-surface shadow-neu-out-sm disabled:opacity-60"
              disabled={inviteMutation.isPending}
              onClick={guard(submitInvite)}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Team
