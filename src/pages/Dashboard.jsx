import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, Target } from 'lucide-react'
import ProgressRing from '@/components/shared/ProgressRing'
import EmptyState from '@/components/shared/EmptyState'
import PageSkeleton from '@/components/shared/PageSkeleton'
import GoalCard from '@/components/goals/GoalCard'
import GoalCreationWizard from '@/components/goals/GoalCreationWizard'
import LiveActivityFeed from '@/components/activity/LiveActivityFeed'
import { Button } from '@/components/ui/button'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { canManageGoals } from '@/lib/roles'
import { greetingForNow } from '@/lib/dates'
import { cn } from '@/lib/utils'

const HERO_IMG =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80'

function StatCell({ label, value, hint, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-1 flex-col items-start gap-2 rounded-[16px] px-1 py-1 text-left sm:items-center sm:px-2"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint sm:text-[11px]">
        {label}
      </span>
      <span
        className={cn(
          'stat-tile stats-number-box w-full max-w-[88px] py-4 text-center text-2xl font-semibold sm:max-w-none sm:text-3xl',
          accent,
        )}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted transition-colors duration-200 group-hover:text-foreground/70">
        {hint}
      </span>
    </button>
  )
}

function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const guard = useGuardedAction()
  const navigate = useNavigate()
  const [wizardOpen, setWizardOpen] = useState(false)

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.data.goals.list(),
  })
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.data.tasks.list(),
  })
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: () => api.data.updates.list(),
  })
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.data.agents.list(),
  })
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.data.members.list(),
  })

  const loading = goalsLoading || tasksLoading || updatesLoading

  const stats = useMemo(() => {
    const activeGoals = goals.filter((g) => g.status === 'active').length
    const blocked = tasks.filter((t) => t.status === 'blocked').length
    const completed = tasks.filter((t) => t.status === 'done').length
    const total = tasks.length
    const avgProgress =
      goals.length === 0
        ? 0
        : Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    const pctDone = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { activeGoals, blocked, completed, total, avgProgress, pctDone }
  }, [goals, tasks])

  const sortedUpdates = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates],
  )

  const nextPlanned =
    agents[0]?.nextPlannedAction || 'Check in with team on blocked tasks'

  const now = new Date()
  const day = format(now, 'd')
  const monthYear = format(now, 'MMMM yyyy').toUpperCase()

  if (loading) return <PageSkeleton cards={4} />

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
            {greetingForNow()}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s what&apos;s happening across your projects today.
          </p>
        </div>
        {!isAuthenticated || canManageGoals(user?.role) ? (
          <Button
            className="btn-neu uppercase tracking-[0.08em]"
            onClick={guard(() => setWizardOpen(true))}
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        ) : null}
      </div>

      {/* Hero + progress — matches live composition */}
      <div className="grid gap-4 md:grid-cols-[1.55fr_0.7fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative min-h-[200px] overflow-hidden rounded-[20px] shadow-neu-out sm:min-h-[240px]"
        >
          <img
            src={HERO_IMG}
            alt="Workspace landscape"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 rounded-[14px] bg-surface/95 px-4 py-3 shadow-neu-out-sm backdrop-blur-sm">
            <p className="text-3xl font-semibold leading-none text-foreground sm:text-4xl">{day}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {monthYear}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35, ease: 'easeOut' }}
          className="neu-raised flex min-h-[200px] items-center justify-center p-5 sm:min-h-[240px]"
        >
          <ProgressRing
            value={stats.avgProgress}
            label="DONE"
            size={148}
            stroke={14}
          />
        </motion.div>
      </div>

      {/* Stat strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
        className="neu-raised flex flex-col gap-2 px-3 py-4 sm:flex-row sm:items-stretch sm:gap-0 sm:px-4"
      >
        <StatCell
          label="Active Goals"
          value={stats.activeGoals}
          hint={`${stats.total} total tasks`}
          onClick={() => navigate('/goals')}
        />
        <div className="mx-1 hidden w-px self-stretch bg-line/50 sm:block" />
        <StatCell
          label="Blocked Tasks"
          value={stats.blocked}
          hint={`${stats.completed} completed`}
          accent="text-terracotta"
          onClick={() => navigate('/tasks?status=blocked')}
        />
        <div className="mx-1 hidden w-px self-stretch bg-line/50 sm:block" />
        <StatCell
          label="Completed Tasks"
          value={stats.completed}
          hint={`${stats.pctDone}% of total`}
          accent="text-sage"
          onClick={() => navigate('/tasks?status=done')}
        />
      </motion.div>

      {/* Side-by-side: Activity scrolls inside its panel; Goals stays beside it */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <LiveActivityFeed
          scrollable
          updates={sortedUpdates}
          members={members}
          agents={agents}
          nextPlannedAction={nextPlanned}
        />

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-faint">Goals</h2>
            <Link to="/goals" className="text-xs font-medium text-muted transition hover:text-foreground">
              View all
            </Link>
          </div>
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No active goals yet."
              description="Create a goal to kick off autonomous planning."
            />
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal, i) => (
                <GoalCard key={goal.id} goal={goal} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <GoalCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}

export default Dashboard
