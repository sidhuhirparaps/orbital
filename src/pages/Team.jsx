import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import AiAvatar from '@/components/shared/AiAvatar'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { canInviteMembers, canManageTeam, roleLabel, ROLES } from '@/lib/roles'

function Team() {
  const { user, isAuthenticated } = useAuth()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const showInvite = !isAuthenticated || canInviteMembers(user?.role)
  const showManage = !isAuthenticated || canManageTeam(user?.role)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES.MEMBER)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.data.members.list(),
  })
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.data.agents.list(),
  })

  const inviteMutation = useMutation({
    mutationFn: () => api.teamAdmin.invite({ name, email, role }),
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Invite sent')
      setInviteOpen(false)
      setName('')
      setEmail('')
      setRole(ROLES.MEMBER)
    },
    onError: (err) => toast.error(err.message),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, nextRole }) => api.teamAdmin.updateRole(memberId, nextRole),
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Role updated')
    },
  })

  if (isLoading) return <PageSkeleton />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        description="People and AI agents collaborating in this workspace."
        actions={
          showInvite ? (
            <Button onClick={guard(() => setInviteOpen(true))}>
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          ) : null
        }
      />

      <section>
        <h2 className="mb-3 text-base font-semibold">Members</h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="neu-raised flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-lavender/40 text-sm font-semibold shadow-neu-out-sm">
                {member.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {member.name}
                  {member.id === user?.id ? (
                    <span className="ml-2 text-xs text-faint">(you)</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">{member.email}</p>
              </div>
              <StatusBadge status={member.status === 'active' ? 'active' : 'invited'} />
              {showManage && member.id !== user?.id ? (
                <Select
                  value={member.role}
                  onValueChange={guard((nextRole) =>
                    roleMutation.mutate({ memberId: member.id, nextRole }),
                  )}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLES).map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs font-medium capitalize text-muted">
                  {roleLabel(member.role)}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">AI Agents</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {agents.map((agent) => (
            <div key={agent.id} className="neu-raised flex gap-4 p-4">
              <AiAvatar name={agent.name} tone={agent.avatarTone} size="lg" />
              <div>
                <p className="font-semibold text-foreground">{agent.name}</p>
                <p className="text-xs text-muted">{agent.role}</p>
                <p className="mt-2 text-sm text-foreground">
                  Next: {agent.nextPlannedAction}
                </p>
                <p className="mt-1 text-xs text-faint">Tone · {agent.tone}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite teammate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLES)
                    .filter((r) => r !== ROLES.OWNER)
                    .map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="neu" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || !email.trim() || inviteMutation.isPending}
              onClick={guard(() => inviteMutation.mutate())}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Team
