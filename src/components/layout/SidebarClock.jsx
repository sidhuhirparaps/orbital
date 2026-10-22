import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Live analog clock for the sidebar footer — soft inset face, local time hands.
 * Approximation of the live ORBITAL mark (original SVG unavailable).
 */
function SidebarClock({ className, size }) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = time.getSeconds()
  const minutes = time.getMinutes() + seconds / 60
  const hours = (time.getHours() % 12) + minutes / 60

  const hand = (angle, length, width, color) => (
    <line
      key={`${angle}-${length}-${width}`}
      x1="50"
      y1="50"
      x2="50"
      y2={50 - length}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      transform={`rotate(${angle} 50 50)`}
    />
  )

  return (
    <div
      aria-label={`Local time: ${time.toLocaleTimeString()}`}
      title={time.toLocaleTimeString()}
      className={cn(
        'rounded-full border border-[rgba(170,152,134,0.1)] bg-[#f4f1ed] shadow-neu-in-sidebar',
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" />
        {hand(hours * 30, 21, 4, '#3a3a3a')}
        {hand(minutes * 6, 29, 2.5, '#3a3a3a')}
        {hand(seconds * 6, 33, 1, '#FF8077')}
        <circle cx="50" cy="50" r="2.5" fill="#3a3a3a" />
      </svg>
    </div>
  )
}

export default SidebarClock
