/** Returns high-resolution timestamp in milliseconds. */
export function preciseNow(): number {
  return performance.now()
}

/**
 * Schedule a callback after a precise delay using rAF loop.
 * Returns a cancel function.
 */
export function scheduleAfter(delayMs: number, callback: () => void): () => void {
  const start = preciseNow()
  let cancelled = false
  let rafId: number

  function tick() {
    if (cancelled) return
    if (preciseNow() - start >= delayMs) {
      callback()
    } else {
      rafId = requestAnimationFrame(tick)
    }
  }

  rafId = requestAnimationFrame(tick)

  return () => {
    cancelled = true
    cancelAnimationFrame(rafId)
  }
}
