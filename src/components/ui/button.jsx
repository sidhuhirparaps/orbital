import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'btn-neu',
        neu: 'btn-neu',
        dark: 'btn-dark-neu',
        outline: 'bg-transparent shadow-neu-out-sm hover:shadow-neu-hover hover:-translate-y-[2px]',
        ghost: 'hover:bg-surface-alt',
        destructive: 'bg-terracotta text-surface shadow-neu-out-sm hover:shadow-neu-hover hover:-translate-y-[2px]',
        link: 'text-muted underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-button px-3 text-xs',
        lg: 'h-11 rounded-button px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const Button = React.forwardRef(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button
