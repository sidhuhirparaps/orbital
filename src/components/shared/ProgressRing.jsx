import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function ProgressRing({
  value = 0,
  size = 120,
  stroke = 10,
  className,
  label,
  showValue = true,
  /** When false, hold at 0 until true (e.g. after dashboard greeting). */
  animate = true,
}) {
  const target = Math.min(100, Math.max(0, value))
  const [display, setDisplay] = useState(animate ? 0 : target)

  useEffect(() => {
    if (!animate) {
      setDisplay(target)
      return undefined
    }
    setDisplay(0)
    const start = performance.now()
    const duration = 700
    let frame = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(target * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate, target])

  const clamped = display
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  const inner = Math.max(size - stroke * 2, 24)
  const valuePx = Math.round(Math.min(32, Math.max(11, inner * 0.34)))
  const labelPx = Math.round(Math.min(11, Math.max(8, size * 0.085)))
  const isHero = size >= 120
  const centerR = Math.max(radius - stroke * 0.9, 8)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} aria-hidden>
        {isHero ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={centerR}
            fill="hsl(var(--canvas))"
          />
        ) : null}

        <g className="-rotate-90 origin-center" style={{ transformOrigin: 'center' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--line))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2ECC8A"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={
              isHero
                ? { filter: 'drop-shadow(0 1px 3px rgba(46, 204, 138, 0.35))' }
                : undefined
            }
          />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        {showValue ? (
          <span
            className="font-semibold leading-none tracking-tight text-foreground"
            style={{ fontSize: valuePx }}
          >
            {Math.round(clamped)}%
          </span>
        ) : null}
        {label ? (
          <span
            className="mt-1.5 font-semibold uppercase tracking-[0.16em] text-muted"
            style={{ fontSize: labelPx }}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default ProgressRing
