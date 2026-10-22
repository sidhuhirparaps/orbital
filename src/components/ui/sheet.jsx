import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SheetContext = React.createContext(null)

function Sheet({ open: openProp, onOpenChange, children, defaultOpen = false }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = onOpenChange ?? setUncontrolled
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({ children, asChild }) {
  const { setOpen } = React.useContext(SheetContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

function SheetContent({ className, side = 'right', children, ...props }) {
  const { open, setOpen } = React.useContext(SheetContext)

  React.useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const sideClass =
    side === 'left'
      ? 'left-0 top-0 h-full w-[min(100%,320px)]'
      : side === 'bottom'
        ? 'bottom-0 left-0 w-full max-h-[85vh]'
        : 'right-0 top-0 h-full w-[min(100%,360px)]'

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 h-full w-full border-0 bg-[hsl(var(--foreground)/0.28)] backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn('absolute z-10 bg-surface p-6 shadow-neu-out', sideClass, className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-button p-1 text-muted"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function SheetHeader({ className, ...props }) {
  return <div className={cn('mb-4 pr-8', className)} {...props} />
}

function SheetTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle }
export default Sheet
