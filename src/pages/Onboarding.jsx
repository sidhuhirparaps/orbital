import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import LogoIcon from '@/components/layout/LogoIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

function Onboarding() {
  const navigate = useNavigate()
  const { demoLogin, isAuthenticated } = useAuth()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('My Team')
  const [saving, setSaving] = useState(false)

  const finish = async () => {
    setSaving(true)
    try {
      if (!isAuthenticated) await demoLogin()
      await api.data.updateSettings({
        workspaceName,
        onboardingComplete: true,
      })
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg">
        <LogoIcon className="mb-10 justify-center" />
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="neu-raised p-8 text-center"
            >
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome to ORBITAL
              </h1>
              <p className="mt-3 text-sm text-muted">
                Autonomous project management that keeps goals, tasks, and agents in sync —
                without the status-meeting tax.
              </p>
              <Button className="mt-8 w-full" onClick={() => setStep(1)}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="neu-raised p-8"
            >
              <h2 className="text-2xl font-semibold text-foreground">Name your workspace</h2>
              <p className="mt-2 text-sm text-muted">
                You can change this anytime in Settings.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <Label htmlFor="ws">Workspace Name</Label>
                <Input
                  id="ws"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <div className="mt-8 flex gap-2">
                <Button variant="neu" className="flex-1" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="flex-1" disabled={saving || !workspaceName.trim()} onClick={finish}>
                  {saving ? 'Saving…' : 'Enter ORBITAL'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Onboarding
