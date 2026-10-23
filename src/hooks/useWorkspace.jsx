import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import {
  readStoredWorkspaceId,
  setActiveWorkspaceId,
  writeStoredWorkspaceId,
  writeStoredWorkspaceLabel,
} from '@/lib/workspaceStore'

const WorkspaceContext = createContext(null)

function readInitialWorkspaceId() {
  const id = readStoredWorkspaceId()
  if (id) setActiveWorkspaceId(id)
  return id
}

export function WorkspaceProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [workspaces, setWorkspaces] = useState([])
  // Hydrate from localStorage so route changes don’t briefly lose workspaceId (ready → false → skeleton)
  const [workspaceId, setWorkspaceId] = useState(readInitialWorkspaceId)
  const [loading, setLoading] = useState(true)
  const userKey = user?.id || user?.email || null

  const applyActive = useCallback((id, list) => {
    const valid = list.find((w) => w.id === id)?.id || list[0]?.id || null
    setWorkspaceId(valid)
    setActiveWorkspaceId(valid)
    writeStoredWorkspaceId(valid)
    const active = list.find((w) => w.id === valid)
    if (active) {
      writeStoredWorkspaceLabel({ name: active.name, role: active.role })
    } else if (!valid) {
      writeStoredWorkspaceLabel(null)
    }
    return valid
  }, [])

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setWorkspaces([])
      applyActive(null, [])
      setLoading(false)
      return []
    }
    setLoading(true)
    try {
      const list = await api.workspaces.ensurePersonalWorkspace({
        name: user.name ? `${user.name}'s Workspace` : 'My Workspace',
      })
      setWorkspaces(list)
      applyActive(readStoredWorkspaceId(), list)
      return list
    } catch (err) {
      console.error('[workspace] refresh failed', err)
      setWorkspaces([])
      applyActive(null, [])
      return []
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user, applyActive])

  useEffect(() => {
    if (authLoading) return undefined

    if (!isAuthenticated || !userKey) {
      setWorkspaces([])
      applyActive(null, [])
      writeStoredWorkspaceLabel(null)
      setLoading(false)
      return undefined
    }

    // Sync before paint so we never flash guest/preview chrome after login
    setLoading(true)
    let cancelled = false
    ;(async () => {
      const list = await refresh()
      if (cancelled) return
      void list
    })()
    return () => {
      cancelled = true
    }
    // Only re-bootstrap when the signed-in identity changes — not on every user object churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, userKey])

  const switchWorkspace = useCallback(
    (nextId) => {
      if (!nextId || nextId === workspaceId) return
      const found = workspaces.find((w) => w.id === nextId)
      if (!found) return
      applyActive(nextId, workspaces)
      queryClient.clear()
      queryClient.invalidateQueries()
    },
    [workspaceId, workspaces, applyActive, queryClient],
  )

  const active = useMemo(
    () => workspaces.find((w) => w.id === workspaceId) || null,
    [workspaces, workspaceId],
  )

  const value = useMemo(
    () => ({
      workspaces,
      workspaceId,
      workspace: active,
      role: active?.role || (isAuthenticated ? null : 'owner'),
      loading: authLoading || loading,
      switchWorkspace,
      refresh,
    }),
    [
      workspaces,
      workspaceId,
      active,
      isAuthenticated,
      authLoading,
      loading,
      switchWorkspace,
      refresh,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}

/**
 * When to fetch page data:
 * - Auth still resolving → wait (don't treat as guest preview)
 * - Guest → preview OK
 * - Signed in → wait until active workspace id is known
 */
export function useQueryReady() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { workspaceId } = useWorkspace()
  return !authLoading && (!isAuthenticated || Boolean(workspaceId))
}

export default useWorkspace
