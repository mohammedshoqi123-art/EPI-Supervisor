/**
 * ═══════════════════════════════════════════════════════════════
 *  Bulk Data Fetcher — Paginated data export without limits
 *  جالب البيانات المجمّع — تصدير مُصفّح بدون حدود
 * ═══════════════════════════════════════════════════════════════
 *  Replaces hard .limit(5000) with paginated fetching
 *  that retrieves ALL matching records safely.
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────

/** Minimal Supabase query builder interface for filter functions.
 *  Covers the chainable methods used across all filter callbacks.
 *  Avoids importing internal Postgrest types which may break across versions. */
interface SupabaseQuery {
  is: (column: string, value: null) => SupabaseQuery
  eq: (column: string, value: unknown) => SupabaseQuery
  neq: (column: string, value: unknown) => SupabaseQuery
  gte: (column: string, value: unknown) => SupabaseQuery
  lte: (column: string, value: unknown) => SupabaseQuery
  gt: (column: string, value: unknown) => SupabaseQuery
  lt: (column: string, value: unknown) => SupabaseQuery
  in: (column: string, values: unknown[]) => SupabaseQuery
  like: (column: string, pattern: string) => SupabaseQuery
  ilike: (column: string, pattern: string) => SupabaseQuery
  order: (column: string, opts?: { ascending?: boolean }) => SupabaseQuery
  limit: (count: number) => SupabaseQuery
  range: (from: number, to: number) => SupabaseQuery
  select: (columns: string, opts?: { count?: string; head?: boolean }) => SupabaseQuery
}

export interface BulkFetchOptions {
  /** Supabase table name */
  table: string
  /** Select query (columns to fetch) */
  select: string
  /** Maximum total rows to fetch (safety limit) */
  maxRows?: number
  /** Page size for each request */
  pageSize?: number
  /** Column to order by */
  orderBy?: string
  /** Order direction */
  orderDirection?: 'asc' | 'desc'
  /** Filters to apply (Supabase query builder) */
  applyFilters?: (query: SupabaseQuery) => SupabaseQuery
  /** Callback for progress updates */
  onProgress?: (fetched: number, total: number | null) => void
}

export interface BulkFetchResult<T = Record<string, unknown>> {
  data: T[]
  totalCount: number
  fetchedCount: number
  truncated: boolean
  elapsed: number
}

// ─── Main Fetch Function ─────────────────────────────────────

/**
 * Fetch all records from a Supabase table with pagination.
 * Respects a safety limit to prevent memory issues.
 */
export async function bulkFetch<T = Record<string, unknown>>(
  options: BulkFetchOptions
): Promise<BulkFetchResult<T>> {
  const {
    table,
    select,
    maxRows = 50000,
    pageSize = 1000,
    orderBy = 'created_at',
    orderDirection = 'desc',
    onProgress,
  } = options

  const startTime = Date.now()
  const allData: T[] = []
  let offset = 0
  let totalCount: number | null = null
  let truncated = false

  // Get total count first
  try {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
    totalCount = count
  } catch {
    // Count query failed, continue without total
  }

  // Paginated fetch loop
  while (true) {
    let query = supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + pageSize - 1)

    // Apply custom filters if provided
    if (options.applyFilters) {
      query = options.applyFilters(query as unknown as SupabaseQuery) as unknown as typeof query
    }

    const { data, error } = await query

    if (error) {
      console.error(`[BulkFetch] Error fetching ${table}:`, error)
      break
    }

    if (!data || data.length === 0) break

    allData.push(...(data as T[]))

    // Progress callback
    onProgress?.(allData.length, totalCount)

    // Check limits
    if (allData.length >= maxRows) {
      truncated = true
      break
    }

    // Check if we've fetched all
    if (data.length < pageSize) break

    offset += pageSize

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50))
  }

  return {
    data: allData,
    totalCount: totalCount || allData.length,
    fetchedCount: allData.length,
    truncated,
    elapsed: Date.now() - startTime,
  }
}

// ═══════════════════════════════════════════════════════════════
// Pre-configured Bulk Fetchers for Common Queries
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all form submissions with related data
 */
export async function bulkFetchSubmissions(filters?: {
  formId?: string
  status?: string
  governorateId?: string
  dateFrom?: string
  dateTo?: string
  campaignType?: string
}): Promise<BulkFetchResult> {
  return bulkFetch({
    table: 'form_submissions',
    select: `
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar),
      districts(name_ar)
    `,
    maxRows: 50000,
    pageSize: 1000,
    applyFilters: (q: SupabaseQuery) => {
      q = q.is('deleted_at', null)
      if (filters?.formId) q = q.eq('form_id', filters.formId)
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
      if (filters?.governorateId && filters.governorateId !== 'all') q = q.eq('governorate_id', filters.governorateId)
      if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)
      if (filters?.dateTo) q = q.lte('created_at', filters.dateTo + 'T23:59:59')
      return q
    },
  })
}

/**
 * Fetch all users
 */
export async function bulkFetchUsers(filters?: {
  role?: string
  active?: boolean
}): Promise<BulkFetchResult> {
  return bulkFetch({
    table: 'profiles',
    select: `
      id, full_name, email, role, is_active, phone,
      governorates(name_ar),
      districts(name_ar),
      created_at, updated_at
    `,
    maxRows: 10000,
    pageSize: 1000,
    applyFilters: (q: SupabaseQuery) => {
      q = q.is('deleted_at', null)
      if (filters?.role && filters.role !== 'all') q = q.eq('role', filters.role)
      if (filters?.active !== undefined) q = q.eq('is_active', filters.active)
      return q
    },
  })
}

/**
 * Fetch all shortages
 */
export async function bulkFetchShortages(filters?: {
  severity?: string
  resolved?: boolean
  governorateId?: string
}): Promise<BulkFetchResult> {
  return bulkFetch({
    table: 'supply_shortages',
    select: `
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name),
      governorates(name_ar),
      districts(name_ar)
    `,
    maxRows: 10000,
    pageSize: 1000,
    applyFilters: (q: SupabaseQuery) => {
      q = q.is('deleted_at', null)
      if (filters?.severity && filters.severity !== 'all') q = q.eq('severity', filters.severity)
      if (filters?.resolved !== undefined) q = q.eq('is_resolved', filters.resolved)
      if (filters?.governorateId && filters.governorateId !== 'all') q = q.eq('governorate_id', filters.governorateId)
      return q
    },
  })
}

/**
 * Fetch audit logs
 */
export async function bulkFetchAuditLogs(filters?: {
  action?: string
  dateFrom?: string
  dateTo?: string
}): Promise<BulkFetchResult> {
  return bulkFetch({
    table: 'audit_logs',
    select: `
      id, action, table_name, record_id, ip_address, created_at,
      profiles(full_name, email, role)
    `,
    maxRows: 20000,
    pageSize: 1000,
    applyFilters: (q: SupabaseQuery) => {
      if (filters?.action && filters.action !== 'all') q = q.eq('action', filters.action)
      if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)
      if (filters?.dateTo) q = q.lte('created_at', filters.dateTo + 'T23:59:59')
      return q
    },
  })
}
