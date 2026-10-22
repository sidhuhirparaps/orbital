import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'peer h-5 w-5 shrink-0 rounded-chip shadow-neu-in-sm flex items-center justify-center transition-all',
      checked ? 'bg-sage text-surface' : 'bg-surface',
      className,
    )}
    {...props}
  >
    {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
  </button>
))
Checkbox.displayName = 'Checkbox'

export { Checkbox }
export default Checkbox
