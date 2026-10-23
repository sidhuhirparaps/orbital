import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth } from '@/hooks/useAuth'
import { roleLabel } from '@/lib/roles'
import { cn } from '@/lib/utils'
import {
  hasLikelyAuthSession,
  readStoredWorkspaceLabel,
} from '@/lib/workspaceStore'

function WorkspacePill({ name, role, collapsed, onClick, disabled, menu }) {
  return (
    <div className={cn('relative mb-4', collapsed && 'flex justify-center')}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={name || 'Workspace'}
        className={cn(
          'workspace-pill flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
          collapsed && 'w-auto justify-center px-2',
          disabled && 'cursor-default opacity-90',
        )}
        aria-haspopup={menu ? 'listbox' : undefined}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavender/35 text-[11px] font-semibold">
          {(name || 'W').slice(0, 1).toUpperCase()}
        </span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">
                {name || 'Workspace'}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-faint">
                {roleLabel(role) || '—'}
              </span>
            </span>
            {!disabled ? <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" /> : null}
          </>
        ) : null}
      </button>
      {menu}
    </div>
  )
}

function WorkspaceSwitcher({ collapsed = false }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { workspaces, workspace, workspaceId, switchWorkspace, loading } = useWorkspace()
  const [open, setOpen] = useState(false)

  const cachedLabel = useMemo(() => readStoredWorkspaceLabel(), [])
  const sessionLikely = useMemo(() => hasLikelyAuthSession(), [])

  // Hard reload: keep last workspace chrome — never flash "Loading workspace…"
  if (authLoading || (isAuthenticated && loading && !workspace)) {
    if (cachedLabel || sessionLikely) {
      return (
        <WorkspacePill
          name={cachedLabel?.name || 'Workspace'}
          role={cachedLabel?.role}
          collapsed={collapsed}
          disabled
        />
      )
    }
    if (collapsed) return null
    return <div className="mb-4 h-[52px]" aria-hidden />
  }

  if (!isAuthenticated) {
    if (collapsed) return null
    return (
      <div className="mb-4 rounded-pill px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
        Preview mode
      </div>
    )
  }

  return (
    <WorkspacePill
      name={workspace?.name}
      role={workspace?.role}
      collapsed={collapsed}
      onClick={() => setOpen((v) => !v)}
      menu={
        open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close workspace menu"
              onClick={() => setOpen(false)}
            />
            <ul
              role="listbox"
              className={cn(
                'absolute z-50 mt-2 max-h-64 overflow-auto rounded-[12px] bg-surface p-1.5 shadow-neu-out',
                collapsed ? 'left-0 w-56' : 'inset-x-0',
              )}
            >
              {workspaces.map((w) => {
                const active = w.id === workspaceId
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition',
                        active
                          ? 'bg-[#e3ddd6] text-foreground'
                          : 'text-muted hover:bg-[#f0ebe6] hover:text-foreground',
                      )}
                      onClick={() => {
                        switchWorkspace(w.id)
                        setOpen(false)
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{w.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-faint">
                        {roleLabel(w.role)}
                      </span>
                      {active ? <Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null
      }
    />
  )
}

export default WorkspaceSwitcher
