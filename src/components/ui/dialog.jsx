import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DialogContext = React.createContext(null)

function Dialog({ open: openProp, onOpenChange, children, defaultOpen = false }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = onOpenChange ?? setUncontrolled

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, asChild, className, ...props }) {
  const { setOpen } = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e)
        setOpen(true)
      },
    })
  }
  return (
    <button type="button" className={className} onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

function DialogContent({ className, children, ...props }) {
  const { open, setOpen } = React.useContext(DialogContext)

  // Lock page scroll while open — prevents layout gaps / strips
  React.useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  // Portal to body so overlay always covers the full viewport
  // (never clipped by layout padding / stacking contexts)
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full border-0 bg-[rgba(46,42,38,0.25)] backdrop-blur-[12px]"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-md rounded-[20px] bg-[#eeeae6] p-6 shadow-neu-out',
          'animate-in fade-in zoom-in-95 duration-200',
          className,
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eeeae6] text-muted shadow-neu-out-sm transition hover:text-foreground hover:shadow-neu-hover"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pr-8', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
export default Dialog
