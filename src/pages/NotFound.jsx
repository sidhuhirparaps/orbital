import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import LogoIcon from '@/components/layout/LogoIcon'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <LogoIcon />
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted">That orbit doesn’t exist in this workspace.</p>
      </div>
      <Button type="button" onClick={() => navigate('/')}>
        Back to dashboard
      </Button>
    </div>
  )
}

export default NotFound
