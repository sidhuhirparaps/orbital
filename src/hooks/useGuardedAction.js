import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Wraps an action so guests can click UI controls but nothing runs.
 */
export function useGuardedAction() {
  const { isAuthenticated } = useAuth()

  return useCallback(
    (action) =>
      (...args) => {
        if (!isAuthenticated) return undefined
        return action?.(...args)
      },
    [isAuthenticated],
  )
}

export default useGuardedAction
