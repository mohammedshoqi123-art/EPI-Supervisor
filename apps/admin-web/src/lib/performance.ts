/**
 * Performance Optimization Utilities
 * 
 * Collection of performance helpers for admin-web
 */

// ─── Debounce ─────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ─── Throttle ─────────────────────────────────────────────
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

// ─── Memoize ──────────────────────────────────────────────
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = func(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T
}

// ─── Lazy Load Image ──────────────────────────────────────
export function lazyLoadImage(img: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src
          observer.unobserve(img)
        }
      })
    },
    { rootMargin: '100px' }
  )
  observer.observe(img)
}

// ─── Virtual Scroll Helper ────────────────────────────────
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
) {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
  const end = Math.min(totalItems, start + visibleCount)
  return { start, end }
}

// ─── Batch Request ────────────────────────────────────────
export function createBatcher<T, R>(
  fetcher: (items: T[]) => Promise<R[]>,
  delay = 50
) {
  const queue: { item: T; resolve: (value: R) => void }[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  function process() {
    const batch = [...queue]
    queue.length = 0
    timer = null

    fetcher(batch.map((b) => b.item)).then((results) => {
      batch.forEach((b, i) => b.resolve(results[i]))
    })
  }

  return (item: T): Promise<R> => {
    return new Promise((resolve) => {
      queue.push({ item, resolve })
      if (!timer) timer = setTimeout(process, delay)
    })
  }
}

// ─── Request Idle Callback ─────────────────────────────────
export function requestIdleCallback(callback: () => void, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 1)
  }
}
