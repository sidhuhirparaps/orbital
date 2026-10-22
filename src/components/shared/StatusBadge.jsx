import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_MAP = {
  pending: { label: 'Pending', variant: 'brown' },
  in_progress: { label: 'In Progress', variant: 'dustyblue' },
  done: { label: 'Done', variant: 'sage' },
  blocked: { label: 'Blocked', variant: 'terracotta' },
  need_help: { label: 'Need Help', variant: 'yellow' },
  active: { label: 'Active', variant: 'lavender' },
  invited: { label: 'Invited', variant: 'blush' },
}

export function statusColorClass(status) {
  const map = {
    pending: 'bg-brown',
    in_progress: 'bg-dustyblue',
    done: 'bg-sage',
    blocked: 'bg-terracotta',
    need_help: 'bg-yellow',
    active: 'bg-lavender',
  }
  return map[status] || 'bg-muted'
}

function StatusBadge({ status, className }) {
  const meta = STATUS_MAP[status] || { label: status, variant: 'default' }
  return (
    <Badge variant={meta.variant} className={cn('capitalize', className)}>
      <span className={cn('pip mr-1.5', statusColorClass(status))} />
      {meta.label}
    </Badge>
  )
}

export default StatusBadge
