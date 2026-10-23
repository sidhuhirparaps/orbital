/**
 * Full-page skeleton only when there is no cached data yet.
 * Leaving a route unmounts the page; coming back remounts it. React Query still
 * has the cache — so we must NOT key the skeleton off isLoading alone.
 */
export function shouldShowPageSkeleton(ready, ...results) {
  const missing = results.filter((r) => r.data === undefined)
  if (missing.length === 0) return false
  if (!ready) return true
  return missing.some((r) => r.isPending)
}
