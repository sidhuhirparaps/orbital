import { cn } from '@/lib/utils'

function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'neu-inset flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface shadow-neu-out-sm text-muted">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export default EmptyState
