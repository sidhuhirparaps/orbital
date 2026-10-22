import { cn } from '@/lib/utils'

const LABELS = {
  all: 'All',
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
  need_help: 'Need Help',
}

/**
 * Clean text-only filter pills — no status dots (colors stay on task cards).
 * Selected = subtle inset; inactive = muted flat. Scrolls horizontally on narrow screens.
 */
function StatusFilterChips({ value, onChange, counts = {} }) {
  const keys = ['all', 'pending', 'in_progress', 'done', 'blocked', 'need_help']

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        role="tablist"
        aria-label="Filter by status"
        className="inline-flex min-w-full items-center gap-1 sm:gap-1.5"
      >
        {keys.map((key) => {
          const active = value === key
          const count = key === 'all' ? (counts.all ?? 0) : (counts[key] ?? 0)

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-medium whitespace-nowrap transition-all duration-200 ease-out',
                active
                  ? 'bg-surface text-foreground shadow-neu-in-sm'
                  : 'bg-transparent text-muted hover:text-foreground',
              )}
            >
              <span>{LABELS[key]}</span>
              <span
                className={cn(
                  'text-[11px] font-normal tabular-nums',
                  active ? 'text-muted' : 'text-faint',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default StatusFilterChips
