import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}

/**
 * Animates a number from 0 to its target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedCounter({
  value,
  duration = 800,
  className,
  format = (n) => Math.round(n).toLocaleString('ar-SA'),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const prevValueRef = useRef(0)

  useEffect(() => {
    const startValue = prevValueRef.current
    const diff = value - startValue
    if (diff === 0) return

    startRef.current = null

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + diff * eased

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValueRef.current = value
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  // Set initial value on mount
  useEffect(() => {
    setDisplayValue(value)
    prevValueRef.current = value
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={cn('tabular-nums', className)} aria-live="polite" aria-label={`${value}`}>
      {format(displayValue)}
    </span>
  )
}
