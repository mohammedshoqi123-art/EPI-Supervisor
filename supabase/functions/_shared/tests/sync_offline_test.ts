/**
 * Tests for sync-offline batch processing logic
 *
 * Verifies the duplicate detection, batch size limits, and result
 * classification logic that runs on every offline sync.
 *
 * Run with: deno test supabase/functions/_shared/tests/sync_offline_test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ═══════════════════════════════════════════════════════════════
// Extracted logic (mirrors sync-offline/index.ts)
// ═══════════════════════════════════════════════════════════════

const MAX_BATCH_SIZE = 50
const SYNC_RATE_LIMIT = 20 // max sync requests per minute

type SyncItem = {
  offline_id?: string
  form_id: string
  data?: Record<string, unknown>
  governorate_id?: string
  district_id?: string
  gps_lat?: number
  gps_lng?: number
  photos?: string[]
  notes?: string
  created_at?: string
  entity_type?: string
}

type SyncResult = {
  offline_id: string
  status: 'synced' | 'duplicate' | 'conflict' | 'error'
  submission_id?: string
  server_data?: Record<string, unknown>
  error?: string
}

function validateBatchSize(items: SyncItem[]): { valid: boolean; error?: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'No items to sync' }
  }
  if (items.length > MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: `Batch too large: ${items.length} items (max ${MAX_BATCH_SIZE})`,
    }
  }
  return { valid: true }
}

function validateItem(item: SyncItem): { valid: boolean; error?: string } {
  if (!item.form_id) {
    return { valid: false, error: 'Missing form_id' }
  }
  return { valid: true }
}

function buildExistingMap(
  existing: Array<{ offline_id: string; id: string; updated_at: string }>,
): Map<string, { id: string; updated_at: string }> {
  const map = new Map<string, { id: string; updated_at: string }>()
  for (const row of existing) {
    map.set(row.offline_id, { id: row.id, updated_at: row.updated_at })
  }
  return map
}

function processItem(
  item: SyncItem,
  existingMap: Map<string, { id: string; updated_at: string }>,
): SyncResult {
  const offlineId = item.offline_id ?? ''

  // Check for duplicate
  if (offlineId && existingMap.has(offlineId)) {
    const existing = existingMap.get(offlineId)!
    return {
      offline_id: offlineId,
      status: 'duplicate',
      submission_id: existing.id,
    }
  }

  // Validate required fields
  if (!item.form_id) {
    return {
      offline_id: offlineId,
      status: 'error',
      error: 'Missing form_id',
    }
  }

  // In the real function, we'd insert here.
  // For testing, we simulate a successful insert.
  return {
    offline_id: offlineId,
    status: 'synced',
    submission_id: `simulated-${Date.now()}`,
  }
}

function buildSummary(results: SyncResult[], errors: SyncResult[]) {
  const synced = results.filter((r) => r.status === 'synced').length
  const duplicates = results.filter((r) => r.status === 'duplicate').length
  const conflicts = results.filter((r) => r.status === 'conflict').length
  const failed = errors.length

  return {
    total: synced + duplicates + conflicts + failed,
    synced,
    duplicate: duplicates,
    conflicts,
    failed,
  }
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

Deno.test('MAX_BATCH_SIZE is 50', () => {
  assertEquals(MAX_BATCH_SIZE, 50)
})

Deno.test('SYNC_RATE_LIMIT is 20 per minute', () => {
  assertEquals(SYNC_RATE_LIMIT, 20)
})

Deno.test('validateBatchSize — empty array is rejected', () => {
  const result = validateBatchSize([])
  assertEquals(result.valid, false)
  assertEquals(result.error, 'No items to sync')
})

Deno.test('validateBatchSize — null is rejected', () => {
  // @ts-expect-error: testing runtime null check
  const result = validateBatchSize(null)
  assertEquals(result.valid, false)
})

Deno.test('validateBatchSize — single item is OK', () => {
  const result = validateBatchSize([{ form_id: 'form-1' }])
  assertEquals(result.valid, true)
})

Deno.test('validateBatchSize — exactly 50 items is OK (boundary)', () => {
  const items: SyncItem[] = Array.from({ length: 50 }, (_, i) => ({
    form_id: `form-${i}`,
    offline_id: `off-${i}`,
  }))
  assertEquals(validateBatchSize(items).valid, true)
})

Deno.test('validateBatchSize — 51 items is rejected', () => {
  const items: SyncItem[] = Array.from({ length: 51 }, (_, i) => ({
    form_id: `form-${i}`,
    offline_id: `off-${i}`,
  }))
  const result = validateBatchSize(items)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Batch too large: 51 items (max 50)')
})

Deno.test('validateItem — with form_id is valid', () => {
  assertEquals(validateItem({ form_id: 'form-1' }).valid, true)
})

Deno.test('validateItem — missing form_id is rejected', () => {
  const result = validateItem({} as SyncItem)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Missing form_id')
})

Deno.test('validateItem — empty form_id is rejected', () => {
  const result = validateItem({ form_id: '' })
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Missing form_id')
})

Deno.test('buildExistingMap — empty input produces empty map', () => {
  const map = buildExistingMap([])
  assertEquals(map.size, 0)
})

Deno.test('buildExistingMap — preserves all entries', () => {
  const existing = [
    { offline_id: 'off-1', id: 'sub-1', updated_at: '2026-06-18T10:00:00Z' },
    { offline_id: 'off-2', id: 'sub-2', updated_at: '2026-06-18T11:00:00Z' },
    { offline_id: 'off-3', id: 'sub-3', updated_at: '2026-06-18T12:00:00Z' },
  ]
  const map = buildExistingMap(existing)
  assertEquals(map.size, 3)
  assertEquals(map.get('off-1')?.id, 'sub-1')
  assertEquals(map.get('off-2')?.updated_at, '2026-06-18T11:00:00Z')
})

Deno.test('processItem — duplicate returns duplicate status', () => {
  const existingMap = buildExistingMap([
    { offline_id: 'off-1', id: 'sub-1', updated_at: '2026-06-18T10:00:00Z' },
  ])
  const item: SyncItem = {
    offline_id: 'off-1',
    form_id: 'form-1',
  }
  const result = processItem(item, existingMap)
  assertEquals(result.status, 'duplicate')
  assertEquals(result.submission_id, 'sub-1')
})

Deno.test('processItem — new item returns synced status', () => {
  const item: SyncItem = {
    offline_id: 'off-new',
    form_id: 'form-1',
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'synced')
  assertExists(result.submission_id)
})

Deno.test('processItem — missing form_id returns error', () => {
  const item: SyncItem = {
    offline_id: 'off-bad',
    form_id: '',
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'error')
  assertEquals(result.error, 'Missing form_id')
})

Deno.test('processItem — item without offline_id is processed', () => {
  // Items without offline_id can't be checked for duplicates,
  // so they always go through the insert path.
  const item: SyncItem = {
    form_id: 'form-1',
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'synced')
  assertEquals(result.offline_id, '')
})

Deno.test('buildSummary — all synced', () => {
  const results: SyncResult[] = [
    { offline_id: '1', status: 'synced' },
    { offline_id: '2', status: 'synced' },
    { offline_id: '3', status: 'synced' },
  ]
  const summary = buildSummary(results, [])
  assertEquals(summary.total, 3)
  assertEquals(summary.synced, 3)
  assertEquals(summary.duplicate, 0)
  assertEquals(summary.conflicts, 0)
  assertEquals(summary.failed, 0)
})

Deno.test('buildSummary — mixed results', () => {
  const results: SyncResult[] = [
    { offline_id: '1', status: 'synced' },
    { offline_id: '2', status: 'duplicate' },
    { offline_id: '3', status: 'synced' },
    { offline_id: '4', status: 'conflict' },
  ]
  const errors: SyncResult[] = [
    { offline_id: '5', status: 'error', error: 'Missing form_id' },
  ]
  const summary = buildSummary(results, errors)
  assertEquals(summary.total, 5)
  assertEquals(summary.synced, 2)
  assertEquals(summary.duplicate, 1)
  assertEquals(summary.conflicts, 1)
  assertEquals(summary.failed, 1)
})

Deno.test('buildSummary — all empty', () => {
  const summary = buildSummary([], [])
  assertEquals(summary.total, 0)
  assertEquals(summary.synced, 0)
  assertEquals(summary.duplicate, 0)
  assertEquals(summary.conflicts, 0)
  assertEquals(summary.failed, 0)
})

// ═══════════════════════════════════════════════════════════════
// Integration-style tests — full batch flow
// ═══════════════════════════════════════════════════════════════

Deno.test('Full batch flow — mixed duplicates and new items', () => {
  const items: SyncItem[] = [
    { offline_id: 'off-1', form_id: 'form-1' }, // duplicate
    { offline_id: 'off-2', form_id: 'form-1' }, // duplicate
    { offline_id: 'off-3', form_id: 'form-1' }, // new
    { offline_id: 'off-4', form_id: 'form-1' }, // new
  ]
  const existingMap = buildExistingMap([
    { offline_id: 'off-1', id: 'sub-1', updated_at: '2026-06-18T10:00:00Z' },
    { offline_id: 'off-2', id: 'sub-2', updated_at: '2026-06-18T11:00:00Z' },
  ])

  // Validate batch size
  const batchValidation = validateBatchSize(items)
  assertEquals(batchValidation.valid, true)

  // Process each item
  const results: SyncResult[] = []
  const errors: SyncResult[] = []
  for (const item of items) {
    const result = processItem(item, existingMap)
    if (result.status === 'error') {
      errors.push(result)
    } else {
      results.push(result)
    }
  }

  // Verify summary
  const summary = buildSummary(results, errors)
  assertEquals(summary.total, 4)
  assertEquals(summary.synced, 2)
  assertEquals(summary.duplicate, 2)
  assertEquals(summary.failed, 0)
})

Deno.test('Full batch flow — empty batch is rejected early', () => {
  const items: SyncItem[] = []
  const validation = validateBatchSize(items)
  assertEquals(validation.valid, false)
  // In the real function, this returns 200 with empty results
})

Deno.test('Full batch flow — oversized batch is rejected', () => {
  const items: SyncItem[] = Array.from({ length: 51 }, (_, i) => ({
    form_id: 'form-1',
    offline_id: `off-${i}`,
  }))
  const validation = validateBatchSize(items)
  assertEquals(validation.valid, false)
  assertEquals(validation.error, 'Batch too large: 51 items (max 50)')
})

// ═══════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════

Deno.test('Edge case — item with empty offline_id is treated as new', () => {
  const existingMap = buildExistingMap([
    { offline_id: '', id: 'sub-empty', updated_at: '2026-06-18T10:00:00Z' },
  ])
  // The empty string check (`offlineId && existingMap.has(...)`)
  // short-circuits — items with empty offline_id are NOT considered
  // duplicates of existing entries with empty offline_id.
  const item: SyncItem = {
    offline_id: '',
    form_id: 'form-1',
  }
  const result = processItem(item, existingMap)
  assertEquals(result.status, 'synced') // NOT 'duplicate'
})

Deno.test('Edge case — very long offline_id is handled', () => {
  const longId = 'off-' + 'x'.repeat(1000)
  const item: SyncItem = {
    offline_id: longId,
    form_id: 'form-1',
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'synced')
  assertEquals(result.offline_id, longId)
})

Deno.test('Edge case — maximum batch size boundary (exactly 50)', () => {
  const items: SyncItem[] = Array.from({ length: 50 }, (_, i) => ({
    form_id: 'form-1',
    offline_id: `off-${i}`,
  }))
  assertEquals(validateBatchSize(items).valid, true)
})

Deno.test('Edge case — items with photos array', () => {
  const item: SyncItem = {
    offline_id: 'off-1',
    form_id: 'form-1',
    photos: ['base64-1', 'base64-2', 'base64-3'],
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'synced')
})

Deno.test('Edge case — items with GPS coordinates', () => {
  const item: SyncItem = {
    offline_id: 'off-1',
    form_id: 'form-1',
    gps_lat: 15.3694,
    gps_lng: 44.191,
  }
  const result = processItem(item, new Map())
  assertEquals(result.status, 'synced')
})
