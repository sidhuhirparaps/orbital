/** Active workspace id for API requests (set by WorkspaceProvider). */

let activeWorkspaceId = null

export function setActiveWorkspaceId(id) {
  activeWorkspaceId = id || null
}

export function getActiveWorkspaceId() {
  return activeWorkspaceId
}

export const ACTIVE_WORKSPACE_STORAGE_KEY = 'orbital.activeWorkspaceId'
export const ACTIVE_WORKSPACE_LABEL_KEY = 'orbital.activeWorkspaceLabel'

export function readStoredWorkspaceId() {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredWorkspaceId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, id)
    else localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Last shown workspace name/role — keeps sidebar stable across hard reload. */
export function readStoredWorkspaceLabel() {
  try {
    const raw = localStorage.getItem(ACTIVE_WORKSPACE_LABEL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.name) return null
    return { name: String(parsed.name), role: parsed.role ? String(parsed.role) : null }
  } catch {
    return null
  }
}

export function writeStoredWorkspaceLabel(label) {
  try {
    if (label?.name) {
      localStorage.setItem(
        ACTIVE_WORKSPACE_LABEL_KEY,
        JSON.stringify({ name: label.name, role: label.role || null }),
      )
    } else {
      localStorage.removeItem(ACTIVE_WORKSPACE_LABEL_KEY)
    }
  } catch {
    /* ignore */
  }
}

/** True if this browser likely still has a Supabase session (sync, for chrome only). */
export function hasLikelyAuthSession() {
  try {
    if (readStoredWorkspaceId()) return true
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) return true
    }
    return false
  } catch {
    return false
  }
}
