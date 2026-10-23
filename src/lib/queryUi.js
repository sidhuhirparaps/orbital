/**
 * Full-page skeleton only for a true first fetch with nothing in cache.
 *
 * Do NOT skeleton when `!ready` alone — that caused a visible flash on every
 * route remount (especially on slower production bundles) even when React Query
 * still held the data.
 */
export function shouldShowPageSkeleton(_ready, ...results) {
  return results.some((r) => r.data === undefined && r.isPending)
}
