import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONE = {
  lavender: 'bg-lavender/50 text-foreground',
  dustyblue: 'bg-dustyblue/50 text-foreground',
  sage: 'bg-sage/30 text-foreground',
  blush: 'bg-blush/50 text-foreground',
}

function AiAvatar({ name = 'AI', tone = 'lavender', size = 'md', className }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-pill shadow-neu-out-sm',
        TONE[tone] || TONE.lavender,
        sizeClass,
        className,
      )}
      title={name}
    >
      <Bot className={iconSize} />
    </div>
  )
}

export default AiAvatar
