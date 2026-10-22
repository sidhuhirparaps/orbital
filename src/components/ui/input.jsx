import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-[10px] bg-canvas px-3 py-2 text-[13px] text-foreground shadow-neu-in-sm',
      'placeholder:text-faint transition-shadow duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
export default Input
