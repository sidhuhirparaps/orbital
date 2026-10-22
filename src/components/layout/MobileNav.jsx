import { NavLink } from 'react-router-dom'
import { ALL_NAV } from '@/components/layout/navConfig'
import { cn } from '@/lib/utils'

function MobileNav() {
  const primary = ALL_NAV.filter((item) =>
    ['/', '/goals', '/my-tasks', '/activity', '/settings'].includes(item.to),
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line/30 bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1">
        {primary.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-chip px-1 py-2 text-[10px] font-medium',
                  isActive ? 'nav-active text-foreground' : 'text-muted',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
