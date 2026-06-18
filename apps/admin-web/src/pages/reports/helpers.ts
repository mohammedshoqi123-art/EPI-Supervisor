import type { UserRole } from '@/types/database'

// ─── Constants ──────────────────────────────────────────────────────────────

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

// ─── Permission Helpers ─────────────────────────────────────────────────────

export function canExportAll(role: UserRole): boolean {
  return ['admin', 'central'].includes(role)
}

export function canExportGovernorate(role: UserRole): boolean {
  return ['admin', 'central', 'governorate'].includes(role)
}
