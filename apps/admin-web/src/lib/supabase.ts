import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Custom fetch with retry logic — scoped to Supabase client only (no global override)
// ═══ FIX: Absolute timeout prevents infinite hangs when network is dead ═══
// Previously: each failed request waited 3.5s × 3 retries = 10.5s per call.
// With 9 dashboard queries = 94.5s of blocking. Now: hard 10s ceiling per call.
const PER_REQUEST_TIMEOUT_MS = 8_000 // 8 seconds per individual attempt
const ABSOLUTE_TIMEOUT_MS = 15_000 // 15 seconds total ceiling (all retries)
const MAX_RETRIES = 2 // Reduced from 3 — fewer retries = faster failure

/** Promise that rejects after [ms] milliseconds */
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new TypeError('Request timed out')), ms)
  })
}

const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // Global deadline — everything must finish within 15s
  const deadline = Date.now() + ABSOLUTE_TIMEOUT_MS

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Check if global deadline already passed
    const remaining = deadline - Date.now()
    if (remaining <= 0) {
      throw new TypeError('Request timed out')
    }

    const perReqTimeout = Math.min(PER_REQUEST_TIMEOUT_MS, remaining)

    try {
      // Race: actual fetch vs per-request timeout
      const response = await Promise.race([
        fetch(input, init),
        timeout(perReqTimeout),
      ])
      return response
    } catch (error: unknown) {
      const isLastAttempt = attempt === MAX_RETRIES
      const isTimeout = error instanceof TypeError && error.message === 'Request timed out'
      const isFetchError = error instanceof TypeError &&
        (error.message === 'Failed to fetch' || error.message.includes('fetch'))

      // Timeout or non-retryable or last attempt → fail immediately
      if (isTimeout || !isFetchError || isLastAttempt) {
        throw isTimeout ? new TypeError('Request timed out') : error
      }

      // Brief delay before retry (check deadline first)
      const delay = Math.min(300 * Math.pow(2, attempt), 1500)
      const waitUntil = Date.now() + delay
      if (waitUntil > deadline) {
        throw new TypeError('Request timed out')
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Should never reach here
  return fetch(input, init)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithRetry,
    headers: {
      'X-Client-Info': 'epi-supervisor-admin',
    },
  },
})

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Log configuration status on load (dev only)
if (import.meta.env.DEV) {
  if (!isConfigured) {
    console.warn('[Supabase] ⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set')
  } else {
    console.info('[Supabase] ✅ Configured:', supabaseUrl)
  }
}
