import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import PageSkeleton from '@/components/shared/PageSkeleton'
import ProgressRing from '@/components/shared/ProgressRing'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import TaskCard from '@/components/tasks/TaskCard'
import TaskFormModal from '@/components/tasks/TaskFormModal'
import { Button } from '@/components/ui/button'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { useQueryReady, useWorkspace } from '@/hooks/useWorkspace'
import { canEditTasks, canManageGoals } from '@/lib/roles'
import { dueClassName, dueLabel, formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

function GoalDetail() {
  const { goalId } = useParams()
  const { isAuthenticated } = useAuth()
  const { workspaceId, role } = useWorkspace()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const showAddTask = !isAuthenticated || canManageGoals(role) || canEditTasks(role)
  const showTaskUpdate = !isAuthenticated || canEditTasks(role)
  const ready = useQueryReady()

  const { data: goalData, isLoading: goalLoading } = useQuery({
    queryKey: ['goals', workspaceId, goalId],
    queryFn: () => api.data.goals.get(goalId),
    enabled: ready,
  })
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', workspaceId, { goalId }],
    queryFn: () => api.data.tasks.list({ goalId }),
    enabled: ready,
  })
  const { data: membersData } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => api.data.members.list(),
    enabled: ready,
  })
  const goal = ready ? goalData : undefined
  const tasks = ready ? tasksData ?? [] : []
  const members = ready ? membersData ?? [] : []

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members],
  )

  const ordered = useMemo(
    () => [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks],
  )

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status, note }) => api.myTasks.updateStatus(taskId, status, note),
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Task updated')
    },
  })

  if (!ready || goalLoading || tasksLoading) return <PageSkeleton />
  if (!goal) {
    return (
      <EmptyState
        title="Goal not found"
        action={
          <Link to="/goals" className="btn-dark-neu">
            Back to goals
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <Link
        to="/goals"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Goals
      </Link>

      <div className="neu-raised mb-6 flex flex-col gap-5 p-5 md:flex-row md:items-center">
        <ProgressRing value={goal.progress} size={110} stroke={10} label="Progress" />
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{goal.title}</h1>
            <StatusBadge status={goal.status} />
          </div>
          <p className="mb-3 text-sm text-muted">{goal.description}</p>
          <p className={cn('text-xs', dueClassName(goal.dueDate))}>
            {dueLabel(goal.dueDate)} · {formatDate(goal.dueDate)}
          </p>
        </div>
        {showAddTask ? (
          <Button onClick={guard(() => setModalOpen(true))}>
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        ) : null}
      </div>

      <h2 className="mb-3 text-base font-semibold">Tasks</h2>
      {ordered.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add the first task for this goal." />
      ) : (
        <div className="space-y-3">
          {ordered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              assigneeName={memberMap[task.assigneeId]}
              canUpdate={showTaskUpdate}
              onStatusChange={(taskId, status, note) =>
                statusMutation.mutate({ taskId, status, note })
              }
            />
          ))}
        </div>
      )}

      <TaskFormModal open={modalOpen} onOpenChange={setModalOpen} goalId={goalId} />
    </div>
  )
}

export default GoalDetail
