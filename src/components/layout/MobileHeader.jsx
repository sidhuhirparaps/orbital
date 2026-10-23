import { Link } from 'react-router-dom'
import LogoIcon from '@/components/layout/LogoIcon'
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher'

/** Compact top wordmark for < lg — primary nav lives in FloatingDock */
function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-canvas/85 px-4 py-3 backdrop-blur-md">
      <Link to="/" className="shrink-0 transition-opacity hover:opacity-80">
        <LogoIcon />
      </Link>
      <div className="min-w-0 flex-1 [&_.mb-4]:mb-0">
        <WorkspaceSwitcher />
      </div>
    </header>
  )
}

export default MobileHeader
