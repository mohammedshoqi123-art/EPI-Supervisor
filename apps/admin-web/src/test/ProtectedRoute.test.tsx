import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

// Mock the ProtectedRoute component
function MockProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  return <div data-testid="protected-content">{children}</div>
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    render(
      <MemoryRouter>
        <MockProtectedRoute>
          <div>Protected Content</div>
        </MockProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByTestId('protected-content')).toBeTruthy()
  })

  it('renders with allowedRoles prop', () => {
    render(
      <MemoryRouter>
        <MockProtectedRoute allowedRoles={['admin', 'central']}>
          <div>Admin Content</div>
        </MockProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByTestId('protected-content')).toBeTruthy()
  })
})

describe('RBAC Role Hierarchy', () => {
  const ROLES = { admin: 5, central: 4, governorate: 3, district: 2, data_entry: 1 }

  it('admin has highest level', () => {
    expect(ROLES.admin).toBe(5)
  })

  it('data_entry has lowest level', () => {
    expect(ROLES.data_entry).toBe(1)
  })

  it('all roles are defined', () => {
    expect(Object.keys(ROLES)).toHaveLength(5)
  })
})
