import { NavLink } from 'react-router-dom'
import {
  Activity,
  Home,
  ListTodo,
  Settings,
  Target,
} from 'lucide-react'
import LogoIcon from '@/components/layout/LogoIcon'
import { cn } from '@/lib/utils'

const DOCK_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function FloatingDock() {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[22px] bg-surface/95 p-2 shadow-neu-out backdrop-blur-md sm:max-w-lg">
        <div className="hidden shrink-0 px-2 sm:block">
          <LogoIcon collapsed className="scale-90" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-0.5">
          {DOCK_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[14px] px-1 py-2 text-[9px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 sm:text-[10px]',
                    isActive
                      ? 'nav-active text-foreground'
                      : 'text-muted hover:-translate-y-[2px] hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default FloatingDock
