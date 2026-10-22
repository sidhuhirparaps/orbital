import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[88px] w-full rounded-input bg-surface px-3 py-2 text-sm text-foreground shadow-neu-in-sm placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
export default Textarea
