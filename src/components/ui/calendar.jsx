import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rdp-neu w-max p-2.5', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-2',
        caption: 'flex justify-center pt-0.5 relative items-center h-8',
        caption_label: 'text-sm font-semibold text-foreground',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted',
          'shadow-neu-out-sm transition hover:text-foreground',
        ),
        nav_button_previous: 'absolute left-0.5',
        nav_button_next: 'absolute right-0.5',
        table: 'border-collapse',
        head_row: 'flex',
        head_cell: 'text-faint rounded-md w-8 font-medium text-[11px] uppercase tracking-wide',
        row: 'flex mt-0.5',
        cell: 'h-8 w-8 text-center text-sm p-0 relative',
        day: cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full p-0 text-[13px] font-medium',
          'text-foreground transition-all duration-150',
          'hover:bg-surface hover:shadow-neu-out-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40',
        ),
        day_selected:
          'bg-surface !text-foreground shadow-neu-in-sm hover:bg-surface hover:shadow-neu-in-sm',
        day_today: 'font-semibold text-foreground underline decoration-sage/60 underline-offset-4',
        day_outside: 'text-faint opacity-45',
        day_disabled: 'text-faint opacity-35',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

export { Calendar }
export default Calendar
