import { describe, it, expect } from 'vitest'
import {
  ROLE_HIERARCHY,
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from './database'
import type { UserRole, SubmissionStatus, ShortageSeverity } from './database'

describe('UserRole types', () => {
  it('defines all 5 roles', () => {
    const roles: UserRole[] = ['admin', 'central', 'governorate', 'district', 'data_entry']
    expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(5)
    roles.forEach(role => {
      expect(ROLE_HIERARCHY[role]).toBeDefined()
    })
  })

  it('has correct hierarchy order', () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.central)
    expect(ROLE_HIERARCHY.central).toBeGreaterThan(ROLE_HIERARCHY.governorate)
    expect(ROLE_HIERARCHY.governorate).toBeGreaterThan(ROLE_HIERARCHY.district)
    expect(ROLE_HIERARCHY.district).toBeGreaterThan(ROLE_HIERARCHY.data_entry)
  })

  it('has Arabic labels for all roles', () => {
    const roles: UserRole[] = ['admin', 'central', 'governorate', 'district', 'data_entry']
    roles.forEach(role => {
      expect(ROLE_LABELS[role]).toBeTruthy()
      expect(typeof ROLE_LABELS[role]).toBe('string')
    })
  })

  it('has CSS classes for all role badges', () => {
    const roles: UserRole[] = ['admin', 'central', 'governorate', 'district', 'data_entry']
    roles.forEach(role => {
      expect(ROLE_COLORS[role]).toContain('bg-')
      expect(ROLE_COLORS[role]).toContain('text-')
    })
  })
})

describe('SubmissionStatus types', () => {
  it('defines draft and submitted statuses', () => {
    const statuses: SubmissionStatus[] = ['draft', 'submitted']
    statuses.forEach(status => {
      expect(STATUS_LABELS[status]).toBeDefined()
      expect(STATUS_COLORS[status]).toBeDefined()
    })
  })

  it('has Arabic labels', () => {
    expect(STATUS_LABELS.draft).toBe('مسودة')
    expect(STATUS_LABELS.submitted).toBe('مرسلة')
  })
})

describe('ShortageSeverity types', () => {
  it('defines all severity levels', () => {
    const levels: ShortageSeverity[] = ['critical', 'high', 'medium', 'low']
    levels.forEach(level => {
      expect(SEVERITY_LABELS[level]).toBeDefined()
      expect(SEVERITY_COLORS[level]).toBeDefined()
    })
  })

  it('has correct Arabic labels', () => {
    expect(SEVERITY_LABELS.critical).toBe('حرج')
    expect(SEVERITY_LABELS.high).toBe('عالي')
    expect(SEVERITY_LABELS.medium).toBe('متوسط')
    expect(SEVERITY_LABELS.low).toBe('منخفض')
  })

  it('critical severity has red color', () => {
    expect(SEVERITY_COLORS.critical).toContain('red')
  })
})
