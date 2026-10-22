import { NavLink } from 'react-router-dom'
import { ALL_NAV } from '@/components/layout/navConfig'
import LogoIcon from '@/components/layout/LogoIcon'
import { cn } from '@/lib/utils'

function TabletNav() {
  return (
    <aside className="sidebar-float relative z-10 flex h-[calc(100vh-48px)] w-[72px] flex-col items-center gap-2 p-3">
      <LogoIcon collapsed className="mb-4" />
      <nav className="flex flex-1 flex-col items-center gap-1">
        {ALL_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'flex h-11 w-11 items-center justify-center rounded-pill transition-all',
                  isActive
                    ? 'nav-active text-foreground'
                    : 'text-muted hover:-translate-y-[3px] hover:shadow-neu-hover',
                )
              }
            >
              <Icon className="h-4 w-4" />
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default TabletNav
