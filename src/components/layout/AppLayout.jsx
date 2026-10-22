import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import FloatingDock from '@/components/layout/FloatingDock'
import MobileHeader from '@/components/layout/MobileHeader'

/**
 * Desktop: sidebar fixed; main column scrolls with the page.
 * Page padding is 24px (p-6) to match the sidebar inset — never flush to the viewport edge.
 */
function AppLayout() {
  return (
    <div className="relative z-10 min-h-screen bg-transparent shadow-none">
      <div className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden p-6 lg:block">
        <div className="pointer-events-auto h-full">
          <Sidebar />
        </div>
      </div>

      {/* pl = sidebar 260 + gap 24 + outer pad 24 */}
      <div className="min-h-screen bg-transparent lg:pl-[calc(260px+3rem)]">
        <div className="lg:hidden">
          <MobileHeader />
        </div>
        <main className="page-container w-full overflow-visible bg-transparent px-4 pb-28 pt-5 shadow-none sm:px-6 sm:pt-6 lg:px-6 lg:pb-10 lg:pt-6">
          <Outlet />
        </main>
      </div>

      <FloatingDock />
    </div>
  )
}

export default AppLayout
