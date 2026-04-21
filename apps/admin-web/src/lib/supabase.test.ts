import { describe, it, expect, vi } from 'vitest'

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  })),
}))

describe('Supabase client', () => {
  it('exports supabase client', async () => {
    const { supabase } = await import('./supabase')
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('exports isConfigured flag', async () => {
    const { isConfigured } = await import('./supabase')
    expect(typeof isConfigured).toBe('boolean')
  })

  it('client has auth methods', async () => {
    const { supabase } = await import('./supabase')
    expect(typeof supabase.auth.getSession).toBe('function')
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
  })

  it('client has database methods', async () => {
    const { supabase } = await import('./supabase')
    expect(typeof supabase.from).toBe('function')
  })

  it('client has edge function methods', async () => {
    const { supabase } = await import('./supabase')
    expect(typeof supabase.functions.invoke).toBe('function')
  })
})
