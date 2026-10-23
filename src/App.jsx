import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { WorkspaceProvider } from '@/hooks/useWorkspace'
import AppLayout from '@/components/layout/AppLayout'
import CursorGlow from '@/components/layout/CursorGlow'
import { Toaster } from '@/components/ui/sonner'
import Dashboard from '@/pages/Dashboard'
import Goals from '@/pages/Goals'
import GoalDetail from '@/pages/GoalDetail'
import MyTasks from '@/pages/MyTasks'
import Tasks from '@/pages/Tasks'
import Activity from '@/pages/Activity'
import Team from '@/pages/Team'
import Settings from '@/pages/Settings'
import Onboarding from '@/pages/Onboarding'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'
import OAuthHashHandler from '@/components/auth/OAuthHashHandler'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep page data warm so route changes don’t flash PageSkeleton
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // When a route remounts, reuse the last data for this query immediately
      placeholderData: (previousData) => previousData,
    },
  },
})

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Browse everything while logged out; writes no-op until LOG IN */}
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="app" element={<Navigate to="/" replace />} />
        <Route path="goals" element={<Goals />} />
        <Route path="goals/:goalId" element={<GoalDetail />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="activity" element={<Activity />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <OAuthHashHandler />
            <CursorGlow />
            <AppRoutes />
            <Toaster position="top-right" />
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
