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
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otpChallenge, setOtpChallenge] = useState(null)

  useEffect(() => {
    let active = true

    const syncSession = async () => {
      try {
        const result = await api.auth.getSession()
        if (!active) return
        setUser(result?.user ?? null)
      } catch (err) {
        console.error('[auth] getSession failed', err)
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    syncSession()

    // Handles Google OAuth return + token refresh
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (!active) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setOtpChallenge(null)
        queryClient.clear()
        return
      }
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        try {
          const result = await api.auth.getSession()
          if (!active) return
          // Do not clear the query cache on SIGNED_IN — Supabase can re-emit this
          // after session recovery and wiping cache forces skeleton flashes on navigation.
          setUser(result?.user ?? null)
          setOtpChallenge(null)
        } catch (err) {
          console.error('[auth] onAuthStateChange failed', err)
        }
      }
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [queryClient])

  const adoptSession = useCallback(
    (nextUser) => {
      // Drop guest/preview cache so sidebar/pages don't flash demo data
      queryClient.clear()
      setUser(nextUser)
      setOtpChallenge(null)
    },
    [queryClient],
  )

  const login = useCallback(
    async ({ email, password }) => {
      const result = await api.auth.login({ email, password })
      if (result.requiresOtp) {
        setOtpChallenge(result)
        return result
      }
      adoptSession(result.user)
      return result
    },
    [adoptSession],
  )

  const verifyOtp = useCallback(
    async ({ challengeId, code }) => {
      const result = await api.auth.verifyOtp({
        challengeId,
        code,
        email: otpChallenge?.email || challengeId,
      })
      adoptSession(result.user)
      return result
    },
    [adoptSession, otpChallenge],
  )

  const demoLogin = useCallback(async () => {
    const result = await api.auth.demoLogin()
    adoptSession(result.user)
    return result
  }, [adoptSession])

  const demoLoginSam = useCallback(async () => {
    const result = await api.auth.demoLoginSam()
    adoptSession(result.user)
    return result
  }, [adoptSession])

  const logout = useCallback(async () => {
    await api.auth.logout()
    setUser(null)
    setOtpChallenge(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      otpChallenge,
      login,
      verifyOtp,
      demoLogin,
      demoLoginSam,
      logout,
      setOtpChallenge,
    }),
    [user, loading, otpChallenge, login, verifyOtp, demoLogin, demoLoginSam, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export default useAuth
