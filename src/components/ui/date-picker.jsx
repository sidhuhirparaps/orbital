import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

const GAP = 8
const VIEW_MARGIN = 8
/** Approximate panel size before first measure — fits compact DayPicker */
const FALLBACK_H = 280
const FALLBACK_W = 244

/**
 * Neumorphic date field + portaled calendar popover.
 * Opens above the field when there isn't room below so it stays fully visible
 * without scrolling. Sized to the calendar grid (not the trigger width).
 */
function DatePicker({ value, onChange, placeholder = 'Pick a date', className, id }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const updatePos = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const panel = panelRef.current
    const panelH = panel?.offsetHeight || FALLBACK_H
    const panelW = panel?.offsetWidth || FALLBACK_W

    const spaceBelow = window.innerHeight - r.bottom - GAP - VIEW_MARGIN
    const spaceAbove = r.top - GAP - VIEW_MARGIN
    const openUp = spaceBelow < panelH && spaceAbove > spaceBelow

    let top = openUp ? r.top - GAP - panelH : r.bottom + GAP
    if (top + panelH > window.innerHeight - VIEW_MARGIN) {
      top = Math.max(VIEW_MARGIN, window.innerHeight - VIEW_MARGIN - panelH)
    }
    if (top < VIEW_MARGIN) top = VIEW_MARGIN

    let left = r.left
    if (left + panelW > window.innerWidth - VIEW_MARGIN) {
      left = window.innerWidth - VIEW_MARGIN - panelW
    }
    if (left < VIEW_MARGIN) left = VIEW_MARGIN

    setPos({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) return undefined
    updatePos()
    // Re-measure after paint so flip uses real panel height
    const raf = requestAnimationFrame(updatePos)
    const onScroll = () => updatePos()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      const t = e.target
      if (triggerRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-[14px] bg-surface px-3.5 text-left text-[13px]',
          'shadow-neu-in transition-shadow duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/30',
          value ? 'text-foreground' : 'text-faint',
        )}
      >
        <span>{value ? format(value, 'MMM d, yyyy') : placeholder}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[230] w-max rounded-[18px] bg-surface p-0 shadow-neu-out animate-in fade-in zoom-in-95"
            >
              <Calendar
                mode="single"
                selected={value}
                onSelect={(day) => {
                  onChange?.(day)
                  setOpen(false)
                }}
                initialFocus
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export { DatePicker }
export default DatePicker
