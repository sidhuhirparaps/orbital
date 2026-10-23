import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { greetingForNow } from '@/lib/dates'

export const DASHBOARD_GREETING_SESSION_KEY = 'orbital.dashboardGreetingPlayed'

const HOLD_MS = 1900
const EXIT_S = 0.45
const CHAR_DURATION = 0.32
const CHAR_STAGGER = 0.05
const CHAR_RISE = 22

export function shouldPlayDashboardGreeting() {
  try {
    return sessionStorage.getItem(DASHBOARD_GREETING_SESSION_KEY) !== '1'
  } catch {
    return true
  }
}

export function markDashboardGreetingPlayed() {
  try {
    sessionStorage.setItem(DASHBOARD_GREETING_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Full-viewport greeting overlay. pointer-events-none so it never blocks clicks.
 * Calls onComplete after hold + fade-out.
 */
function DashboardGreetingIntro({ active, onComplete }) {
  const [visible, setVisible] = useState(active)
  const text = useMemo(() => greetingForNow(), [])
  const chars = useMemo(() => Array.from(text), [text])

  useEffect(() => {
    if (!active) return undefined
    markDashboardGreetingPlayed()
    setVisible(true)

    const html = document.documentElement
    const { body } = document
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const restoreScroll = () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }

    const hideTimer = window.setTimeout(() => setVisible(false), HOLD_MS)
    const doneTimer = window.setTimeout(() => {
      restoreScroll()
      onComplete?.()
    }, HOLD_MS + EXIT_S * 1000)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(doneTimer)
      restoreScroll()
    }
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="dashboard-greeting"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: '#ebe7e2' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_S, ease: 'easeOut' }}
          aria-live="polite"
          aria-hidden={false}
        >
          <p
            className="m-0 max-w-[92vw] whitespace-nowrap text-center font-light tracking-[-0.02em]"
            style={{
              color: '#3a3a3a',
              fontSize: 'clamp(1.75rem, 7vw, 3rem)', // ~28–48px
              fontWeight: 300,
              lineHeight: 1.15,
            }}
          >
            {chars.map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                className="inline-block"
                style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
                initial={{ opacity: 0, y: CHAR_RISE }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: CHAR_DURATION,
                  delay: i * CHAR_STAGGER,
                  ease: 'easeOut',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default DashboardGreetingIntro
