import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'

describe('Card component', () => {
  it('renders card with children', () => {
    render(<Card data-testid="card">Card content</Card>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders card header with title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders card description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>This is a description</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('This is a description')).toBeInTheDocument()
  })

  it('renders card content', () => {
    render(
      <Card>
        <CardContent>Main content here</CardContent>
      </Card>
    )
    expect(screen.getByText('Main content here')).toBeInTheDocument()
  })

  it('renders full card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Overview stats</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Stats go here</p>
        </CardContent>
      </Card>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview stats')).toBeInTheDocument()
    expect(screen.getByText('Stats go here')).toBeInTheDocument()
  })
})
