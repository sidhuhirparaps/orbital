import * as React from 'react'
import { cn } from '@/lib/utils'

const DropdownContext = React.createContext(null)

function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

function DropdownMenuTrigger({ children, asChild, className }) {
  const { open, setOpen } = React.useContext(DropdownContext)
  const onClick = () => setOpen(!open)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e)
        onClick()
      },
    })
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ className, children, align = 'end' }) {
  const { open, setOpen } = React.useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[160px] rounded-card bg-surface p-1 shadow-neu-out',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({ className, children, onSelect, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-chip px-3 py-2 text-left text-sm text-foreground hover:bg-surface-alt',
        className,
      )}
      onClick={(e) => onSelect?.(e)}
      {...props}
    >
      {children}
    </button>
  )
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
export default DropdownMenu
