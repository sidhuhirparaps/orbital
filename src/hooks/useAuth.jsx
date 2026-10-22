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

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otpChallenge, setOtpChallenge] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const result = await api.auth.getSession()
        if (active) setUser(result?.user ?? null)
      } catch (err) {
        console.error('[auth] getSession failed', err)
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async ({ email, password }) => {
      const result = await api.auth.login({ email, password })
      if (result.requiresOtp) {
        setOtpChallenge(result)
        return result
      }
      setUser(result.user)
      setOtpChallenge(null)
      queryClient.invalidateQueries()
      return result
    },
    [queryClient],
  )

  const verifyOtp = useCallback(
    async ({ challengeId, code }) => {
      const result = await api.auth.verifyOtp({
        challengeId,
        code,
        email: otpChallenge?.email || challengeId,
      })
      setUser(result.user)
      setOtpChallenge(null)
      queryClient.invalidateQueries()
      return result
    },
    [queryClient, otpChallenge],
  )

  const demoLogin = useCallback(async () => {
    const result = await api.auth.demoLogin()
    setUser(result.user)
    setOtpChallenge(null)
    queryClient.invalidateQueries()
    return result
  }, [queryClient])

  const demoLoginSam = useCallback(async () => {
    const result = await api.auth.demoLoginSam()
    setUser(result.user)
    setOtpChallenge(null)
    queryClient.invalidateQueries()
    return result
  }, [queryClient])

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
