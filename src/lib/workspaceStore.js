/** Active workspace id for API requests (set by WorkspaceProvider). */

let activeWorkspaceId = null

export function setActiveWorkspaceId(id) {
  activeWorkspaceId = id || null
}

export function getActiveWorkspaceId() {
  return activeWorkspaceId
}

export const ACTIVE_WORKSPACE_STORAGE_KEY = 'orbital.activeWorkspaceId'
