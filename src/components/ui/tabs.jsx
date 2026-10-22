import * as React from 'react'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext(null)

function Tabs({ value, onValueChange, defaultValue, children, className }) {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const setCurrent = onValueChange ?? setInternal
  return (
    <TabsContext.Provider value={{ value: current, setValue: setCurrent }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn('inline-flex gap-1 rounded-card bg-surface p-1 shadow-neu-in-sm', className)}
      {...props}
    />
  )
}

function TabsTrigger({ value, className, children, ...props }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        'rounded-chip px-3 py-1.5 text-sm font-medium transition-all',
        active ? 'nav-active text-foreground' : 'text-muted hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children, ...props }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export default Tabs
