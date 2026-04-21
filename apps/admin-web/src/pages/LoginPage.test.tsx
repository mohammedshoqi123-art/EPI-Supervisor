import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './LoginPage'

// Mock hooks
vi.mock('@/hooks/useApi', () => ({
  useSignIn: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useAuth: () => ({
    data: { session: null },
    isLoading: false,
  }),
}))

vi.mock('@/lib/supabase', () => ({
  isConfigured: true,
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('renders login form with email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument()
  })

  it('renders login button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument()
  })

  it('renders EPI branding', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/EPI Supervisor/i)).toBeInTheDocument()
  })
})
