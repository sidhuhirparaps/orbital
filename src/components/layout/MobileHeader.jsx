import { Link } from 'react-router-dom'
import LogoIcon from '@/components/layout/LogoIcon'

/** Compact top wordmark for < lg — primary nav lives in FloatingDock */
function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-canvas/85 px-4 py-3 backdrop-blur-md">
      <Link to="/" className="transition-opacity hover:opacity-80">
        <LogoIcon />
      </Link>
    </header>
  )
}

export default MobileHeader
