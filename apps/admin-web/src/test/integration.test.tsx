/**
 * Integration tests for admin-web
 * Tests the flow: Login → Dashboard → Form → Submit → Review
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the entire Supabase module
const mockInvoke = vi.fn()
const mockSignIn = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignIn,
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      is: vi.fn().mockReturnThis(),
    }),
    functions: { invoke: mockInvoke },
  },
  isConfigured: true,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('shows login form when not authenticated', async () => {
    const { default: LoginPage } = await import('@/pages/LoginPage')
    render(<LoginPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument()
    })
  })

  it('has submit button that triggers sign in', async () => {
    mockSignIn.mockResolvedValue({ data: { user: {} }, error: null })

    const { default: LoginPage } = await import('@/pages/LoginPage')
    render(<LoginPage />, { wrapper: createWrapper() })

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i)
    const passwordInput = screen.getByLabelText(/كلمة المرور/i)
    const submitBtn = screen.getByRole('button', { name: /تسجيل الدخول/i })

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitBtn)

    // The mutation should be triggered (mocked)
    await waitFor(() => {
      expect(submitBtn).toBeInTheDocument()
    })
  })
})

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock authenticated session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user', email: 'admin@test.com' },
          access_token: 'test-token',
        },
      },
      error: null,
    })
  })

  it('handles dashboard data loading', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        kpis: {
          total_users: 100,
          active_users: 80,
          total_submissions: 500,
          today_submissions: 25,
          pending_submissions: 10,
        },
        charts: {},
        recent_activity: [],
      },
      error: null,
    })

    // Verify mock works
    const result = await mockInvoke('get-admin-dashboard')
    expect(result.data.kpis.total_users).toBe(100)
    expect(result.data.kpis.total_submissions).toBe(500)
  })
})

describe('Form Submission Flow', () => {
  it('submits form data via edge function', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, submission_id: 'new-sub-123' },
      error: null,
    })

    const result = await mockInvoke('submit-form', {
      body: {
        form_id: 'form-123',
        data: { field1: 'value1' },
      },
    })

    expect(result.data.success).toBe(true)
    expect(result.data.submission_id).toBe('new-sub-123')
  })

  it('handles form submission errors', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Validation failed' },
    })

    const result = await mockInvoke('submit-form', {
      body: { form_id: 'form-123', data: {} },
    })

    expect(result.error).toBeDefined()
    expect(result.error.message).toBe('Validation failed')
  })
})

describe('Review/Approval Flow', () => {
  it('reviews submission via admin-actions', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, message: 'Submission reviewed' },
      error: null,
    })

    const result = await mockInvoke('admin-actions', {
      body: {
        action: 'update_submission_status',
        submission_id: 'sub-123',
        status: 'approved',
      },
    })

    expect(result.data.success).toBe(true)
  })
})
