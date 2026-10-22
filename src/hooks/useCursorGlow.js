import { useEffect, useRef, useState } from 'react'

export function useCursorGlow() {
  const target = useRef({ x: 50, y: 50 })
  const current = useRef({ x: 50, y: 50 })
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const rafRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined

    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      target.current = { x, y }
    }

    window.addEventListener('mousemove', onMove, { passive: true })

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.04
      current.current.y += (target.current.y - current.current.y) * 0.04
      setPos({ x: current.current.x, y: current.current.y })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return pos
}

export default useCursorGlow
