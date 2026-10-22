import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-chip px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface text-foreground shadow-neu-out-sm',
        sage: 'bg-sage/20 text-foreground',
        terracotta: 'bg-terracotta/25 text-foreground',
        blush: 'bg-blush/40 text-foreground',
        dustyblue: 'bg-dustyblue/40 text-foreground',
        yellow: 'bg-yellow/30 text-foreground',
        lavender: 'bg-lavender/40 text-foreground',
        brown: 'bg-brown/25 text-foreground',
        outline: 'shadow-neu-in-sm text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
export default Badge
