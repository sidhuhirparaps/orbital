import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckSquare } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import TaskCard from '@/components/tasks/TaskCard'
import StatusFilterChips from '@/components/tasks/StatusFilterChips'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

function MyTasks() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', user?.id ?? 'guest'],
    queryFn: () => api.myTasks.list(user?.id),
    enabled: !isAuthenticated || Boolean(user?.id),
  })
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.data.goals.list(),
  })

  const goalMap = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g.title])),
    [goals],
  )

  const counts = useMemo(() => {
    const c = { all: tasks.length }
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1
    })
    return c
  }, [tasks])

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter((t) => t.status === filter)
  }, [tasks, filter])

  const mutation = useMutation({
    mutationFn: ({ taskId, status, note }) => api.myTasks.updateStatus(taskId, status, note),
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['updates'] })
      toast.success('Updated')
    },
  })

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="My Tasks"
        description="Your assignments, check-ins, and status updates."
      />

      <div className="mb-5">
        <StatusFilterChips value={filter} onChange={setFilter} counts={counts} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nothing here"
          description="Tasks assigned to you will show up in this list."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              goalTitle={goalMap[task.goalId]}
              canUpdate
              onStatusChange={(taskId, status, note) =>
                mutation.mutate({ taskId, status, note })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTasks
