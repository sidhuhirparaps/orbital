import { cn } from '@/lib/utils'

function LogoIcon({ collapsed = false, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        collapsed && 'justify-center',
        className,
      )}
    >
      <div className="relative h-8 w-8 shrink-0" aria-hidden>
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-lavender" />
        <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-lavender" />
        <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-lavender" />
        <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-lavender" />
      </div>
      {!collapsed ? (
        <span className="text-sm font-semibold tracking-[0.28em] text-foreground">
          ORBITAL
        </span>
      ) : null}
    </div>
  )
}

export default LogoIcon
