import { useCursorGlow } from '@/hooks/useCursorGlow'

function CursorGlow() {
  const { x, y } = useCursorGlow()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(circle 600px at ${x}% ${y}%, rgba(201, 179, 245, 0.35) 0%, transparent 70%)`,
      }}
    />
  )
}

export default CursorGlow
