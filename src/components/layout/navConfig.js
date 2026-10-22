import {
  Activity,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Settings,
  Target,
  Users,
} from 'lucide-react'

export const WORKSPACE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
]

export const MANAGEMENT_NAV = [
  { to: '/activity', label: 'Agent Activity', icon: Activity },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const ALL_NAV = [...WORKSPACE_NAV, ...MANAGEMENT_NAV]
