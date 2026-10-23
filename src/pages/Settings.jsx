import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import PageSkeleton from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { useQueryReady, useWorkspace } from '@/hooks/useWorkspace'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`,
)

const PING_OPTIONS = ['Once daily', 'Twice daily', 'Weekly']
const TONE_OPTIONS = [
  'Friendly & casual',
  'Professional & concise',
  'Direct & assertive',
  'Encouraging coach',
]

function Settings() {
  const { isAuthenticated } = useAuth()
  const { workspaceId, refresh } = useWorkspace()
  const ready = useQueryReady()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings', workspaceId],
    queryFn: () => api.data.getSettings(),
    enabled: ready,
  })

  const [workspaceName, setWorkspaceName] = useState('My Team')
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00')
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00')
  const [pingFrequency, setPingFrequency] = useState('Once daily')
  const [aiTone, setAiTone] = useState('Friendly & casual')

  useEffect(() => {
    if (!data) return
    setWorkspaceName(data.workspaceName || 'My Team')
    setWorkingHoursStart(data.workingHoursStart || '09:00')
    setWorkingHoursEnd(data.workingHoursEnd || '17:00')
    setPingFrequency(data.pingFrequency || 'Once daily')
    setAiTone(data.aiTone || 'Friendly & casual')
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.data.updateSettings({
        workspaceName,
        workingHoursStart,
        workingHoursEnd,
        pingFrequency,
        aiTone,
      }),
    onSuccess: () => {
      if (!isAuthenticated) return
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      refresh()
      toast.success('Settings saved')
    },
    onError: (err) => toast.error(err.message || 'Save failed'),
  })

  if (!ready || isLoading) return <PageSkeleton cards={2} />

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Link
          to="/"
          className="btn-neu inline-flex h-9 items-center gap-2 px-3 text-sm lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure your AI assistant and workspace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="flex flex-col gap-4">
          <section className="neu-raised p-5 sm:p-6">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Workspace
            </h2>
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-xs text-muted">
                Workspace Name
              </Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                placeholder="My Team"
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
          </section>

          <section className="neu-raised p-5 sm:p-6">
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Working Hours
            </h2>
            <p className="mb-1 text-sm font-medium text-foreground">Active Window</p>
            <p className="mb-4 text-xs text-faint">
              AI will only send pings during these hours
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted">Start</Label>
                <Select value={workingHoursStart} onValueChange={setWorkingHoursStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted">End</Label>
                <Select value={workingHoursEnd} onValueChange={setWorkingHoursEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Button
            className="btn-neu w-full uppercase tracking-[0.12em] sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={guard(() => saveMutation.mutate())}
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>

        <section className="neu-raised h-fit p-5 sm:p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            AI Assistant
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Ping Frequency</Label>
              <p className="text-xs text-faint">
                How often the AI checks in with team members
              </p>
              <Select value={pingFrequency} onValueChange={setPingFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PING_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">AI Tone</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
