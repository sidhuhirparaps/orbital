import { useEffect, useState } from 'react'

/** Simple ease-out count-up; starts only when `active` becomes true. */
function CountUp({ value, active = true, duration = 700, className }) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(active ? 0 : target)

  useEffect(() => {
    if (!active) {
      setDisplay(target)
      return undefined
    }

    setDisplay(0)
    const start = performance.now()
    let frame = 0

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target, duration])

  return <span className={className}>{display}</span>
}

export default CountUp
