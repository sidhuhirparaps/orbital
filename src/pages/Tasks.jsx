import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ListTodo } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import TaskCard from '@/components/tasks/TaskCard'
import StatusFilterChips from '@/components/tasks/StatusFilterChips'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditTasks } from '@/lib/roles'

function Tasks() {
  const { user, isAuthenticated } = useAuth()
  const [params, setParams] = useSearchParams()
  const initial = params.get('status') || 'all'
  const [filter, setFilter] = useState(initial)
  const queryClient = useQueryClient()
  const showTaskUpdate = !isAuthenticated || canEditTasks(user?.role)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.data.tasks.list(),
  })
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.data.goals.list(),
  })
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.data.members.list(),
  })

  const goalMap = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g.title])),
    [goals],
  )
  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members],
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Task updated')
    },
  })

  const onFilter = (value) => {
    setFilter(value)
    if (value === 'all') setParams({})
    else setParams({ status: value })
  }

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="All workspace tasks across goals and assignees."
      />

      <div className="mb-5">
        <StatusFilterChips value={filter} onChange={onFilter} counts={counts} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks match this filter" />
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              goalTitle={goalMap[task.goalId]}
              assigneeName={memberMap[task.assigneeId]}
              canUpdate={showTaskUpdate}
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

export default Tasks
