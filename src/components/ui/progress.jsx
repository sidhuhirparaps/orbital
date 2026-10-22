import { cn } from '@/lib/utils'

function Progress({ value = 0, className, ...props }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('progress-track', className)} {...props}>
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}

export { Progress }
export default Progress
