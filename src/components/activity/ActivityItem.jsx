import { motion } from 'framer-motion'
import AiAvatar from '@/components/shared/AiAvatar'
import { relativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'

function ActivityItem({ item, actorName, isAgent = false, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.28, ease: 'easeOut' }}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      <div className="relative flex flex-col items-center">
        {isAgent ? (
          <AiAvatar name={actorName} size="sm" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-surface text-xs font-semibold shadow-neu-out-sm">
            {(actorName || '?').slice(0, 1)}
          </div>
        )}
        <div className="mt-1 w-px flex-1 bg-line/50" />
      </div>
      <div className={cn('neu-raised-sm flex-1 p-3')}>
        <p className="text-sm text-foreground">{item.message || item.summary}</p>
        <p className="mt-1 text-xs text-faint">
          {actorName} · {relativeTime(item.createdAt)}
        </p>
      </div>
    </motion.div>
  )
}

export default ActivityItem
