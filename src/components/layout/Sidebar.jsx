import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import LogoIcon from '@/components/layout/LogoIcon'
import SidebarClock from '@/components/layout/SidebarClock'
import { MANAGEMENT_NAV, WORKSPACE_NAV } from '@/components/layout/navConfig'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { isOverdue } from '@/lib/dates'
import { cn } from '@/lib/utils'

function NavGroup({ title, items, collapsed }) {
  return (
    <div className="mb-5">
      {!collapsed ? (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
          {title}
        </p>
      ) : null}
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-pill px-3 py-2.5 text-sm font-medium',
                  isActive ? 'nav-active' : 'nav-item-idle',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

function Sidebar() {
  const { logout, isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.data.tasks.list(),
  })

  const statusCounts = useMemo(() => {
    const blocked = tasks.filter((t) => t.status === 'blocked').length
    const overdue = tasks.filter(
      (t) => isOverdue(t.dueDate) && t.status !== 'done',
    ).length
    return { blocked, overdue }
  }, [tasks])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 260 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="sidebar-float flex h-full max-h-[calc(100vh-3rem)] flex-col p-4 sm:p-5"
    >
      <div
        className={cn(
          'mb-6 flex h-8 items-center px-1',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        <LogoIcon collapsed={collapsed} />
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-button p-2 text-muted shadow-neu-out-sm transition hover:shadow-neu-hover"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <NavGroup title="Workspace" items={WORKSPACE_NAV} collapsed={collapsed} />
        <NavGroup title="Management" items={MANAGEMENT_NAV} collapsed={collapsed} />
      </div>

      {/* Footer: clock + tasks status (replaces name/role), then log out / collapse */}
      <div className="mt-3 space-y-3">
        <div
          className={cn(
            'flex items-stretch gap-2',
            collapsed && 'flex-col items-center gap-2',
          )}
        >
          {/* Exactly half / half */}
          <div
            className={cn(
              'flex aspect-square items-center justify-center',
              collapsed ? 'w-11' : 'w-1/2',
            )}
          >
            <SidebarClock className="h-full w-full" />
          </div>

          {!collapsed ? (
            <Link
              to="/tasks"
              className="flex w-1/2 flex-col justify-center rounded-[14px] border border-[rgba(170,152,134,0.1)] bg-[#f4f1ed] px-2.5 py-2 shadow-neu-in-sidebar transition hover:shadow-neu-in-sidebar"
            >
              <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-faint">
                Tasks Status
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] leading-tight text-muted">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta',
                      statusCounts.blocked > 0 && 'animate-pulse-danger',
                    )}
                  />
                  <span>{statusCounts.blocked} Blocked</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] leading-tight text-muted">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full bg-brown',
                      statusCounts.overdue > 0 && 'animate-pulse-danger',
                    )}
                  />
                  <span>{statusCounts.overdue} Overdue</span>
                </div>
              </div>
            </Link>
          ) : null}
        </div>

        {collapsed ? (
          <div className="flex w-full flex-col items-center gap-2">
            {!isAuthenticated ? (
              <Link
                to="/auth"
                title="Log in"
                className="flex w-full items-center justify-center rounded-pill border border-[rgba(255,252,248,0.55)] bg-surface py-2.5 text-muted shadow-neu-out-sm transition hover:shadow-neu-hover hover:text-foreground"
                aria-label="Log in"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => logout()}
                title="Log out"
                className="flex w-full items-center justify-center rounded-pill border border-[rgba(255,252,248,0.55)] bg-surface py-2.5 text-muted shadow-neu-out-sm transition hover:shadow-neu-hover hover:text-foreground"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-pill border border-[rgba(255,252,248,0.55)] bg-surface py-2.5 text-muted shadow-neu-out-sm transition hover:shadow-neu-hover hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : !isAuthenticated ? (
          <Link
            to="/auth"
            className="btn-neu flex w-full items-center justify-center gap-2.5 rounded-pill px-4 py-3 text-[15px] font-medium uppercase tracking-[0.14em] text-foreground"
          >
            <LogIn className="h-5 w-5" />
            <span>Log In</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2.5 rounded-pill border border-[rgba(255,252,248,0.55)] bg-surface px-4 py-3 text-[15px] font-medium text-muted shadow-neu-out-sm transition hover:shadow-neu-hover hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </motion.aside>
  )
}

export default Sidebar
