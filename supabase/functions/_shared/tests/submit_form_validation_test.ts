/**
 * Tests for submit-form validation logic
 *
 * These tests verify the pure validation functions extracted from
 * submit-form/index.ts. The Edge Function itself requires a live
 * Supabase instance, but the validation rules can be tested in
 * isolation.
 *
 * Run with: deno test supabase/functions/_shared/tests/submit_form_validation_test.ts
 */

import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ═══════════════════════════════════════════════════════════════
// Extracted validation logic (mirrors submit-form/index.ts)
// ═══════════════════════════════════════════════════════════════

const ROLE_HIERARCHY: Record<string, number> = {
  'admin': 5,
  'central': 4,
  'governorate': 3,
  'district': 2,
  'data_entry': 1,
}

const VALID_STATUSES = ['draft', 'submitted']
const MAX_PAYLOAD_SIZE = 1024 * 1024 // 1MB
const MAX_PHOTOS_DEFAULT = 5

interface UserProfile {
  role: string
  governorate_id: string | null
  district_id: string | null
}

function validateSubmissionPermissions(
  userProfile: UserProfile,
  targetGovId: string | null,
  targetDistId: string | null,
): { valid: boolean; error?: string } {
  const p = userProfile

  switch (p.role) {
    case 'admin':
    case 'central':
      return { valid: true }

    case 'governorate':
      if (targetGovId && targetGovId !== p.governorate_id) {
        return { valid: false, error: 'Cannot submit data for a different governorate' }
      }
      return { valid: true }

    case 'district':
      if (targetGovId && targetGovId !== p.governorate_id) {
        return { valid: false, error: 'Cannot submit data for a different governorate' }
      }
      if (targetDistId && targetDistId !== p.district_id) {
        return { valid: false, error: 'Cannot submit data for a different district' }
      }
      return { valid: true }

    case 'data_entry':
      if (targetGovId !== p.governorate_id || targetDistId !== p.district_id) {
        return {
          valid: false,
          error: 'Data entry users can only submit for their assigned area',
        }
      }
      return { valid: true }

    default:
      return { valid: false, error: `Invalid role: ${p.role}` }
  }
}

function validateGpsCoordinates(
  gpsLat: number | null | undefined,
  gpsLng: number | null | undefined,
): { valid: boolean; error?: string } {
  if (gpsLat !== undefined && gpsLat !== null) {
    if (typeof gpsLat !== 'number' || gpsLat < -90 || gpsLat > 90) {
      return { valid: false, error: 'Invalid gps_lat: must be between -90 and 90' }
    }
  }
  if (gpsLng !== undefined && gpsLng !== null) {
    if (typeof gpsLng !== 'number' || gpsLng < -180 || gpsLng > 180) {
      return { valid: false, error: 'Invalid gps_lng: must be between -180 and 180' }
    }
  }
  return { valid: true }
}

function validateStatus(status: string): { valid: boolean; error?: string } {
  if (!VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    }
  }
  return { valid: true }
}

function validatePayloadSize(body: unknown): { valid: boolean; error?: string } {
  const size = JSON.stringify(body).length
  if (size > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload too large (max 1MB)' }
  }
  return { valid: true }
}

function validateFormId(formId: unknown): { valid: boolean; error?: string } {
  if (!formId || typeof formId !== 'string') {
    return { valid: false, error: 'form_id is required and must be a string' }
  }
  return { valid: true }
}

function validatePhotos(
  photos: unknown,
  required: boolean,
  maxPhotos: number = MAX_PHOTOS_DEFAULT,
): { valid: boolean; error?: string } {
  const photosArray = Array.isArray(photos) ? photos : []

  if (required && photosArray.length === 0) {
    return { valid: false, error: 'This form requires at least one photo' }
  }

  if (photosArray.length > maxPhotos) {
    return { valid: false, error: `Maximum ${maxPhotos} photo(s) allowed` }
  }

  return { valid: true }
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

Deno.test('ROLE_HIERARCHY — has all 5 roles', () => {
  assertEquals(Object.keys(ROLE_HIERARCHY).length, 5)
  assertEquals(ROLE_HIERARCHY['admin'], 5)
  assertEquals(ROLE_HIERARCHY['central'], 4)
  assertEquals(ROLE_HIERARCHY['governorate'], 3)
  assertEquals(ROLE_HIERARCHY['district'], 2)
  assertEquals(ROLE_HIERARCHY['data_entry'], 1)
})

Deno.test('validateSubmissionPermissions — admin can submit anywhere', () => {
  const admin: UserProfile = { role: 'admin', governorate_id: null, district_id: null }
  assertEquals(validateSubmissionPermissions(admin, 'gov-1', 'dist-1').valid, true)
  assertEquals(validateSubmissionPermissions(admin, null, null).valid, true)
  assertEquals(validateSubmissionPermissions(admin, 'gov-99', 'dist-99').valid, true)
})

Deno.test('validateSubmissionPermissions — central can submit anywhere', () => {
  const central: UserProfile = { role: 'central', governorate_id: 'gov-1', district_id: null }
  assertEquals(validateSubmissionPermissions(central, 'gov-99', null).valid, true)
})

Deno.test('validateSubmissionPermissions — governorate can submit only to own governorate', () => {
  const gov: UserProfile = { role: 'governorate', governorate_id: 'gov-1', district_id: null }

  // Same governorate — OK
  assertEquals(validateSubmissionPermissions(gov, 'gov-1', 'dist-1').valid, true)

  // Different governorate — REJECTED
  const result = validateSubmissionPermissions(gov, 'gov-2', null)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Cannot submit data for a different governorate')

  // Null governorate — OK (will use profile.governorate_id)
  assertEquals(validateSubmissionPermissions(gov, null, null).valid, true)
})

Deno.test('validateSubmissionPermissions — district can submit only to own district', () => {
  const dist: UserProfile = { role: 'district', governorate_id: 'gov-1', district_id: 'dist-1' }

  // Same district — OK
  assertEquals(validateSubmissionPermissions(dist, 'gov-1', 'dist-1').valid, true)

  // Different district — REJECTED
  const result = validateSubmissionPermissions(dist, 'gov-1', 'dist-2')
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Cannot submit data for a different district')

  // Different governorate — REJECTED
  const result2 = validateSubmissionPermissions(dist, 'gov-2', 'dist-1')
  assertEquals(result2.valid, false)
  assertEquals(result2.error, 'Cannot submit data for a different governorate')
})

Deno.test('validateSubmissionPermissions — data_entry must match exactly', () => {
  const de: UserProfile = { role: 'data_entry', governorate_id: 'gov-1', district_id: 'dist-1' }

  // Exact match — OK
  assertEquals(validateSubmissionPermissions(de, 'gov-1', 'dist-1').valid, true)

  // Any mismatch — REJECTED
  assertEquals(validateSubmissionPermissions(de, 'gov-1', 'dist-2').valid, false)
  assertEquals(validateSubmissionPermissions(de, 'gov-2', 'dist-1').valid, false)
  assertEquals(validateSubmissionPermissions(de, null, null).valid, false)
})

Deno.test('validateSubmissionPermissions — invalid role is rejected', () => {
  const invalid: UserProfile = { role: 'superuser', governorate_id: null, district_id: null }
  const result = validateSubmissionPermissions(invalid, null, null)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Invalid role: superuser')
})

Deno.test('validateGpsCoordinates — valid coordinates', () => {
  assertEquals(validateGpsCoordinates(15.3694, 44.191).valid, true)
  assertEquals(validateGpsCoordinates(0, 0).valid, true)
  assertEquals(validateGpsCoordinates(-90, -180).valid, true) // boundary
  assertEquals(validateGpsCoordinates(90, 180).valid, true)   // boundary
})

Deno.test('validateGpsCoordinates — null/undefined is OK (optional)', () => {
  assertEquals(validateGpsCoordinates(null, null).valid, true)
  assertEquals(validateGpsCoordinates(undefined, undefined).valid, true)
})

Deno.test('validateGpsCoordinates — lat out of range is rejected', () => {
  assertEquals(validateGpsCoordinates(91, 0).valid, false)
  assertEquals(validateGpsCoordinates(-91, 0).valid, false)
})

Deno.test('validateGpsCoordinates — lng out of range is rejected', () => {
  assertEquals(validateGpsCoordinates(0, 181).valid, false)
  assertEquals(validateGpsCoordinates(0, -181).valid, false)
})

Deno.test('validateGpsCoordinates — non-number types are rejected', () => {
  // @ts-expect-error: testing runtime type check
  assertEquals(validateGpsCoordinates('15.3', 44.1).valid, false)
  // @ts-expect-error: testing runtime type check
  assertEquals(validateGpsCoordinates(15.3, '44.1').valid, false)
})

Deno.test('validateStatus — draft is valid', () => {
  assertEquals(validateStatus('draft').valid, true)
})

Deno.test('validateStatus — submitted is valid', () => {
  assertEquals(validateStatus('submitted').valid, true)
})

Deno.test('validateStatus — reviewed is rejected', () => {
  const result = validateStatus('reviewed')
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Invalid status. Must be one of: draft, submitted')
})

Deno.test('validateStatus — approved is rejected', () => {
  // Note: 'approved' is a valid DB enum value but NOT accepted by submit-form
  // (submissions can only be created in 'draft' or 'submitted' state)
  assertEquals(validateStatus('approved').valid, false)
})

Deno.test('validateStatus — empty string is rejected', () => {
  assertEquals(validateStatus('').valid, false)
})

Deno.test('validatePayloadSize — small payload is OK', () => {
  assertEquals(validatePayloadSize({ form_id: 'abc' }).valid, true)
})

Deno.test('validatePayloadSize — large payload is rejected', () => {
  // Create a payload > 1MB
  const largeData = 'x'.repeat(1024 * 1024 + 100)
  const result = validatePayloadSize({ data: largeData })
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Payload too large (max 1MB)')
})

Deno.test('validateFormId — string ID is valid', () => {
  assertEquals(validateFormId('form-uuid-123').valid, true)
})

Deno.test('validateFormId — empty string is rejected', () => {
  assertEquals(validateFormId('').valid, false)
})

Deno.test('validateFormId — null is rejected', () => {
  assertEquals(validateFormId(null).valid, false)
})

Deno.test('validateFormId — number is rejected (must be string)', () => {
  assertEquals(validateFormId(123).valid, false)
})

Deno.test('validatePhotos — not required, no photos is OK', () => {
  assertEquals(validatePhotos([], false).valid, true)
  assertEquals(validatePhotos(undefined, false).valid, true)
})

Deno.test('validatePhotos — required, no photos is rejected', () => {
  const result = validatePhotos([], true)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'This form requires at least one photo')
})

Deno.test('validatePhotos — within max is OK', () => {
  assertEquals(validatePhotos(['p1', 'p2', 'p3'], false, 5).valid, true)
})

Deno.test('validatePhotos — exceeds max is rejected', () => {
  const result = validatePhotos(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], false, 5)
  assertEquals(result.valid, false)
  assertEquals(result.error, 'Maximum 5 photo(s) allowed')
})

Deno.test('validatePhotos — maxPhotos=1 enforces single photo', () => {
  assertEquals(validatePhotos(['p1'], false, 1).valid, true)
  assertEquals(validatePhotos(['p1', 'p2'], false, 1).valid, false)
})

// ═══════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════

Deno.test('Edge case — boundary GPS coordinates (exactly ±90, ±180)', () => {
  // Latitude: -90 to 90 inclusive
  assertEquals(validateGpsCoordinates(90, 0).valid, true)
  assertEquals(validateGpsCoordinates(-90, 0).valid, true)
  // Longitude: -180 to 180 inclusive
  assertEquals(validateGpsCoordinates(0, 180).valid, true)
  assertEquals(validateGpsCoordinates(0, -180).valid, true)
})

Deno.test('Edge case — Sana\'a coordinates (Yemen capital)', () => {
  // Sana'a: 15.3694° N, 44.1910° E
  assertEquals(validateGpsCoordinates(15.3694, 44.1910).valid, true)
})

Deno.test('Edge case — Aden coordinates (Yemen)', () => {
  // Aden: 12.7794° N, 45.0367° E
  assertEquals(validateGpsCoordinates(12.7794, 45.0367).valid, true)
})

Deno.test('Edge case — ROLE_HIERARCHY strict ordering', () => {
  assertNotEquals(ROLE_HIERARCHY['admin'], ROLE_HIERARCHY['central'])
  assertNotEquals(ROLE_HIERARCHY['central'], ROLE_HIERARCHY['governorate'])
  assertNotEquals(ROLE_HIERARCHY['governorate'], ROLE_HIERARCHY['district'])
  assertNotEquals(ROLE_HIERARCHY['district'], ROLE_HIERARCHY['data_entry'])
})
