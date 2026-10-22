import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Target } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import GoalCard from '@/components/goals/GoalCard'
import GoalCreationWizard from '@/components/goals/GoalCreationWizard'
import { Button } from '@/components/ui/button'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { canManageGoals } from '@/lib/roles'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
]

function Goals() {
  const { user, isAuthenticated } = useAuth()
  const guard = useGuardedAction()
  const [filter, setFilter] = useState('active')
  const [wizardOpen, setWizardOpen] = useState(false)
  const showManage = !isAuthenticated || canManageGoals(user?.role)

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.data.goals.list(),
  })

  const filtered = useMemo(() => {
    if (filter === 'all') return goals
    if (filter === 'completed') return goals.filter((g) => g.status === 'completed' || g.progress >= 100)
    return goals.filter((g) => g.status === 'active')
  }, [goals, filter])

  if (isLoading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Outcomes your agents and team are driving toward."
        actions={
          showManage ? (
            <Button onClick={guard(() => setWizardOpen(true))}>
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          ) : null
        }
      />

      <div className="-mx-1 mb-5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label="Filter goals" className="inline-flex items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center rounded-pill px-3.5 text-[13px] font-medium whitespace-nowrap transition-all duration-200 ease-out',
                  active
                    ? 'bg-surface text-foreground shadow-neu-in-sm'
                    : 'bg-transparent text-muted hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No active goals yet."
          description="Create a goal to get started."
          action={
            showManage ? (
              <Button onClick={guard(() => setWizardOpen(true))}>
                <Plus className="h-4 w-4" />
                New Goal
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
          ))}
        </div>
      )}

      <GoalCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}

export default Goals
