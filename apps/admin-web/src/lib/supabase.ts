import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Custom fetch with retry logic — scoped to Supabase client only (no global override)
const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const maxRetries = 3

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init)
      return response
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries
      const isFetchError = error instanceof TypeError &&
        (error.message === 'Failed to fetch' || error.message.includes('fetch'))

      if (!isFetchError || isLastAttempt) {
        throw error
      }

      // Wait before retry with exponential backoff
      const delay = Math.min(500 * Math.pow(2, attempt), 3000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
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
