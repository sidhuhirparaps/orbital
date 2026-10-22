import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageSquare } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { dueClassName, dueLabel, relativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'

const STATUSES = ['pending', 'in_progress', 'done', 'blocked', 'need_help']

function TaskCard({
  task,
  goalTitle,
  assigneeName,
  onStatusChange,
  canUpdate = false,
  index = 0,
}) {
  const guard = useGuardedAction()
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.28), duration: 0.3, ease: 'easeOut' }}
      className="neu-raised p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 rounded-button p-1 text-muted"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle notes"
        >
          <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {goalTitle ? <p className="mb-1 text-xs text-faint">{goalTitle}</p> : null}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={dueClassName(task.dueDate)}>{dueLabel(task.dueDate)}</span>
            {assigneeName ? <span className="text-muted">{assigneeName}</span> : null}
            <span className="text-faint">{relativeTime(task.updatedAt)}</span>
          </div>

          {canUpdate ? (
            <div className="mt-3 max-w-xs">
              <Select
                value={task.status}
                onValueChange={guard((status) => onStatusChange?.(task.id, status))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-line/40 pt-4 pl-8">
              {task.notes ? <p className="text-sm text-muted">{task.notes}</p> : (
                <p className="text-sm text-faint">No notes yet.</p>
              )}
              {(task.checkIns || []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Check-ins
                  </p>
                  {task.checkIns.map((ci) => (
                    <div key={ci.id} className="neu-inset-sm p-3 text-xs text-muted">
                      <span className="text-faint">{relativeTime(ci.at)}</span>
                      <p className="mt-1">{ci.note}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {canUpdate ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a check-in note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="neu"
                    disabled={!note.trim()}
                    onClick={guard(() => {
                      onStatusChange?.(task.id, task.status, note.trim())
                      setNote('')
                    })}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Save check-in
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default TaskCard
