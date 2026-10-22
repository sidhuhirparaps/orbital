import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { cn } from '@/lib/utils'

const STEPS = ['Goal', 'Clarify', 'Tasks', 'Commit']

const fieldLabel = 'text-[13px] font-medium text-[#5c5650]'
const fieldInset =
  'h-11 rounded-[14px] border-0 bg-surface px-3.5 text-[13px] shadow-neu-in placeholder:text-faint focus-visible:ring-lavender/25'
const areaInset =
  'min-h-[120px] resize-y rounded-[14px] border-0 bg-surface px-3.5 py-3 text-[13px] shadow-neu-in placeholder:text-faint focus-visible:ring-lavender/25'

function suggestTasks(title) {
  const base = title.trim() || 'this goal'
  return [
    { title: `Define success criteria for ${base}`, status: 'pending' },
    { title: `Break down milestones for ${base}`, status: 'pending' },
    { title: `Assign owners and due dates`, status: 'pending' },
    { title: `Schedule first check-in with Orbit Agent`, status: 'pending' },
  ]
}

function GoalCreationWizard({ open, onOpenChange }) {
  const { user } = useAuth()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 21)
    return d
  })
  const [successLooksLike, setSuccessLooksLike] = useState('')
  const [constraints, setConstraints] = useState('')
  const [priority, setPriority] = useState('medium')
  const [tasks, setTasks] = useState([])

  const reset = () => {
    setStep(0)
    setTitle('')
    setDescription('')
    const d = new Date()
    d.setDate(d.getDate() + 21)
    setTargetDate(d)
    setSuccessLooksLike('')
    setConstraints('')
    setPriority('medium')
    setTasks([])
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const due = targetDate instanceof Date ? targetDate : new Date(Date.now() + 21 * 86400000)
      const goal = await api.data.goals.create({
        title,
        description,
        status: 'active',
        progress: 0,
        ownerId: user.id,
        dueDate: due.toISOString(),
        clarifyingAnswers: { successLooksLike, constraints, priority },
      })
      await Promise.all(
        tasks.map((t, i) =>
          api.data.tasks.create({
            goalId: goal.id,
            title: t.title,
            notes: '',
            status: t.status || 'pending',
            assigneeId: user.id,
            order: i + 1,
            dueDate: new Date(due.getTime() - (tasks.length - i) * 2 * 86400000).toISOString(),
            checkIns: [],
          }),
        ),
      )
      await api.data.updates.create({
        type: 'goal_created',
        entityType: 'goal',
        entityId: goal.id,
        actorId: user.id,
        message: `${user.name} created goal “${title}”`,
      })
      return goal
    },
    onSuccess: (goal) => {
      if (!goal) return
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['updates'] })
      toast.success('Goal created')
      reset()
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message || 'Failed to create goal'),
  })

  const canNext = useMemo(() => {
    if (step === 0) return title.trim().length > 2
    if (step === 1) return successLooksLike.trim().length > 2
    if (step === 2) return tasks.length > 0 && tasks.every((t) => t.title.trim())
    return true
  }, [step, title, successLooksLike, tasks])

  const goNext = () => {
    if (step === 1) {
      setTasks(suggestTasks(title))
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent
        className={cn(
          'max-h-[min(92vh,720px)] w-full max-w-[540px] overflow-y-auto rounded-[28px]',
          'border-0 bg-surface p-6 shadow-neu-out sm:max-w-[560px] sm:p-8',
        )}
      >
        <DialogHeader className="mb-5 space-y-1.5 pr-10">
          <DialogTitle className="text-[22px] font-semibold tracking-tight text-[#3d3833] sm:text-[24px]">
            New Goal
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted">
            Guided setup — clarify outcomes, then commit AI-suggested tasks.
          </DialogDescription>
        </DialogHeader>

        {/* Step pills — active = soft raised; idle = uppercase muted text */}
        <div className="mb-7 flex flex-wrap items-center gap-1 sm:gap-1.5">
          {STEPS.map((label, i) => {
            const active = i === step
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (i < step) setStep(i)
                }}
                className={cn(
                  'rounded-pill px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-200',
                  active
                    ? 'bg-surface text-[#3d3833] shadow-neu-out-sm'
                    : 'bg-transparent text-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="space-y-5">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="goal-title" className={fieldLabel}>
                  Goal title
                </Label>
                <Input
                  id="goal-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Launch Q2 product refresh"
                  className={fieldInset}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-desc" className={fieldLabel}>
                  Description
                </Label>
                <Textarea
                  id="goal-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you trying to achieve?"
                  className={areaInset}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-date" className={fieldLabel}>
                  Target date
                </Label>
                <DatePicker
                  id="goal-date"
                  value={targetDate}
                  onChange={setTargetDate}
                  placeholder="Pick a target date"
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label className={fieldLabel}>What does success look like?</Label>
                <Textarea
                  value={successLooksLike}
                  onChange={(e) => setSuccessLooksLike(e.target.value)}
                  placeholder="Concrete outcome the team can recognize"
                  className={areaInset}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabel}>Constraints</Label>
                <Textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Budget, timeline, tech, people…"
                  className={areaInset}
                />
              </div>
              <div className="space-y-2">
                <Label className={fieldLabel}>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-11 rounded-[14px] border-0 bg-surface shadow-neu-in">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] text-muted">
                <Sparkles className="h-4 w-4 text-lavender" />
                AI suggested task list — edit before committing.
              </div>
              {tasks.map((task, i) => (
                <Input
                  key={i}
                  value={task.title}
                  onChange={(e) => {
                    const next = [...tasks]
                    next[i] = { ...next[i], title: e.target.value }
                    setTasks(next)
                  }}
                  className={fieldInset}
                />
              ))}
              <Button
                type="button"
                variant="neu"
                size="sm"
                className="mt-1"
                onClick={() => setTasks((t) => [...t, { title: 'New task', status: 'pending' }])}
              >
                Add task
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 rounded-[16px] bg-surface p-5 text-[13px] shadow-neu-in">
              <p>
                <span className="font-semibold text-foreground">Goal:</span>{' '}
                <span className="text-muted">{title}</span>
              </p>
              <p className="text-muted">{description || 'No description'}</p>
              <p>
                <span className="font-semibold text-foreground">Target:</span>{' '}
                <span className="text-muted">
                  {targetDate ? targetDate.toLocaleDateString() : '—'}
                </span>
              </p>
              <p>
                <span className="font-semibold text-foreground">Success:</span>{' '}
                <span className="text-muted">{successLooksLike}</span>
              </p>
              <p>
                <span className="font-semibold text-foreground">Tasks:</span>{' '}
                <span className="text-muted">{tasks.length} ready to create</span>
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-8 gap-2 sm:gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="neu"
              className="h-11 min-w-[96px] rounded-[14px] text-[13px] text-muted"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="neu"
              disabled={!canNext}
              className="h-11 min-w-[112px] rounded-[14px] px-6 text-[13px] font-medium text-[#6b6560]"
              onClick={goNext}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              variant="neu"
              disabled={createMutation.isPending}
              className="h-11 min-w-[112px] rounded-[14px] px-6 text-[13px] font-medium text-[#6b6560]"
              onClick={guard(() => createMutation.mutate())}
            >
              {createMutation.isPending ? 'Creating…' : 'Commit goal'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GoalCreationWizard
