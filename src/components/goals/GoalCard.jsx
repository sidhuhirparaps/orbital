import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight } from 'lucide-react'
import ProgressRing from '@/components/shared/ProgressRing'
import StatusBadge from '@/components/shared/StatusBadge'
import { dueClassName, dueLabel, formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

function GoalCard({ goal, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.3), duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="neu-raised p-5 transition-[box-shadow,transform] duration-200 ease-out hover:shadow-neu-hover"
    >
      <Link to={`/goals/${goal.id}`} className="flex gap-4">
        <ProgressRing value={goal.progress} size={72} stroke={7} showValue className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{goal.title}</h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
          </div>
          <p className="mb-3 line-clamp-2 text-sm text-muted">{goal.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={goal.status} />
            <span className={cn('inline-flex items-center gap-1 text-xs', dueClassName(goal.dueDate))}>
              <Calendar className="h-3 w-3" />
              {dueLabel(goal.dueDate) || formatDate(goal.dueDate)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default GoalCard
