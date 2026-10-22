import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-card bg-surface shadow-neu-in-sm', className)}
      {...props}
    />
  )
}

export { Skeleton }
export default Skeleton
