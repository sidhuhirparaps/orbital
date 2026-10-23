import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Mail } from 'lucide-react'
import LogoIcon from '@/components/layout/LogoIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login, demoLogin, demoLoginSam } = useAuth()
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'signin'

  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const title = useMemo(
    () =>
      mode === 'signup' ? 'Create your account' : 'Welcome to Project Management App',
    [mode],
  )

  const goApp = () => navigate('/', { replace: true })

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
        })
        if (error) throw error
        if (!data.session) {
          toast.message('Account created. Confirm your email if required, then sign in.')
          setMode('signin')
          return
        }
        toast.success('Welcome')
        window.location.assign('/')
        return
      }

      const result = await login({ email, password })
      if (result.requiresOtp) {
        toast.message(result.message)
        return
      }
      toast.success('Welcome back')
      goApp()
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = async () => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (error) throw error
      // Browser redirects to Google; no further UI work here
    } catch (err) {
      toast.error(
        err.message ||
          'Enable Google in Supabase → Authentication → Providers, then try again.',
      )
      setBusy(false)
    }
  }

  const onForgot = async () => {
    if (!email.trim()) {
      toast.message('Enter your email above, then click Forgot password.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/auth`,
      })
      if (error) throw error
      toast.success('Password reset email sent (if that account exists).')
    } catch (err) {
      toast.error(err.message || 'Could not send reset email')
    } finally {
      setBusy(false)
    }
  }

  const onDemo = async (which) => {
    setBusy(true)
    try {
      if (which === 'sam') await demoLoginSam()
      else await demoLogin()
      toast.success(which === 'sam' ? 'Signed in as Sam' : 'Signed in as Alex')
      goApp()
    } catch (err) {
      toast.error(err.message || 'Demo login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 flex h-[100dvh] items-center justify-center overflow-hidden bg-[#e8e8ec] px-4">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white px-9 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f0f8]">
            <LogoIcon collapsed />
          </div>
        </div>

        <h1 className="text-center text-[1.45rem] font-bold leading-snug tracking-tight text-[#1a1c23] sm:text-[1.55rem]">
          {title}
        </h1>
        <p className="mt-1 text-center text-[13px] text-[#8b8f9a]">
          {mode === 'signup' ? 'Create an account to get started' : 'Sign in to continue'}
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={onGoogle}
          className={cn(
            'mt-5 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#e4e4ea] bg-white text-sm font-medium text-[#1a1c23]',
            'transition hover:bg-[#fafafa] disabled:opacity-60',
          )}
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e8e8ee]" />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9a9aa3]">OR</span>
          <div className="h-px flex-1 bg-[#e8e8ee]" />
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[12px] font-medium text-[#3d3d45]">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa3]" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 rounded-xl border-0 bg-[#f3f3f6] pl-10 text-[14px] shadow-none placeholder:text-[#b0b0b8] focus-visible:ring-1 focus-visible:ring-[#cfcfd6]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-[12px] font-medium text-[#3d3d45]">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa3]" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-11 rounded-xl border-0 bg-[#f3f3f6] pl-10 text-[14px] shadow-none placeholder:text-[#b0b0b8] focus-visible:ring-1 focus-visible:ring-[#cfcfd6]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={busy}
            className="mt-1 h-11 w-full rounded-full bg-[#1a1c23] text-[14px] font-semibold text-white shadow-none hover:bg-[#2a2d36] hover:shadow-none"
          >
            {mode === 'signup' ? 'Sign up' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3 text-[12px]">
          <button
            type="button"
            onClick={onForgot}
            className="text-[#8b8f9a] transition hover:text-[#1a1c23]"
          >
            Forgot password?
          </button>
          <p className="text-[#8b8f9a]">
            {mode === 'signup' ? (
              <>
                Have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-[#1a1c23]"
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-[#1a1c23]"
                  onClick={() => setMode('signup')}
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 border-t border-[#eeeef2] pt-3 text-[12px] text-[#8b8f9a]">
          <span>Demo:</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDemo('alex')}
            className="font-medium text-[#1a1c23] underline-offset-2 hover:underline disabled:opacity-60"
          >
            Alex
          </button>
          <span className="text-[#d0d0d6]">·</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDemo('sam')}
            className="font-medium text-[#1a1c23] underline-offset-2 hover:underline disabled:opacity-60"
          >
            Sam
          </button>
          <span className="text-[#d0d0d6]">·</span>
          <Link to="/" className="hover:text-[#1a1c23]">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Auth
