import { createSeedData } from '@/api/seed'

/** Read-only in-memory snapshot for logged-out browsing (Sam-style full demo). */
let cache = null

export function getPreviewDb() {
  if (!cache) cache = createSeedData()
  return cache
}

export function previewGoals() {
  return [...getPreviewDb().goals]
}

export function previewGoal(id) {
  return getPreviewDb().goals.find((g) => g.id === id) ?? null
}

export function previewTasks(filter = {}) {
  let items = [...getPreviewDb().tasks]
  if (filter.goalId) items = items.filter((t) => t.goalId === filter.goalId)
  if (filter.assigneeId) items = items.filter((t) => t.assigneeId === filter.assigneeId)
  return items
}

export function previewUpdates() {
  return [...getPreviewDb().updates]
}

export function previewMembers() {
  return [...getPreviewDb().members]
}

export function previewAgents() {
  return [...getPreviewDb().agents]
}

export function previewAgentActivity() {
  return [...getPreviewDb().agent_activity]
}

export function previewPings() {
  return [...getPreviewDb().pings]
}

export function previewSettings() {
  return { ...getPreviewDb().settings }
}
