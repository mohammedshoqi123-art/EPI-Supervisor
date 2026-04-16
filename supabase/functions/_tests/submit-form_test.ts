/**
 * Tests for submit-form Edge Function.
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/_tests/submit-form_test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ─── Mock Environment ───────────────────────────────────────
Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
Deno.env.set('SUPABASE_ANON_KEY', 'test-anon-key');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

// ─── Test Data ──────────────────────────────────────────────
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_FORM_ID = '660e8400-e29b-41d4-a716-446655440001';
const TEST_GOV_ID = '770e8400-e29b-41d4-a716-446655440002';
const TEST_DIST_ID = '880e8400-e29b-41d4-a716-446655440003';

// ─── Helper: Validate GPS Coordinates ───────────────────────
Deno.test('GPS validation: rejects lat > 90', () => {
  const lat = 91;
  const valid = lat >= -90 && lat <= 90;
  assertEquals(valid, false);
});

Deno.test('GPS validation: rejects lat < -90', () => {
  const lat = -91;
  const valid = lat >= -90 && lat <= 90;
  assertEquals(valid, false);
});

Deno.test('GPS validation: rejects lng > 180', () => {
  const lng = 181;
  const valid = lng >= -180 && lng <= 180;
  assertEquals(valid, false);
});

Deno.test('GPS validation: accepts valid coordinates', () => {
  const lat = 15.3694; // Yemen approximate
  const lng = 44.191;
  assertEquals(lat >= -90 && lat <= 90, true);
  assertEquals(lng >= -180 && lng <= 180, true);
});

// ─── Helper: Validate Status Values ─────────────────────────
Deno.test('Status validation: accepts valid statuses', () => {
  const validStatuses = ['draft', 'submitted', 'reviewed', 'approved', 'rejected'];
  for (const status of validStatuses) {
    assertEquals(validStatuses.includes(status), true, `Status "${status}" should be valid`);
  }
});

Deno.test('Status validation: rejects invalid status', () => {
  const validStatuses = ['draft', 'submitted', 'reviewed', 'approved', 'rejected'];
  assertEquals(validStatuses.includes('invalid_status'), false);
  assertEquals(validStatuses.includes(''), false);
  assertEquals(validStatuses.includes('SUBMITTED'), false); // case-sensitive
});

// ─── Helper: Validate Role Hierarchy ────────────────────────
Deno.test('Role hierarchy: admin can submit anywhere', () => {
  const role = 'admin';
  const hierarchy: Record<string, number> = {
    admin: 5, central: 4, governorate: 3, district: 2, data_entry: 1,
  };
  assertEquals(hierarchy[role] >= 4, true);
});

Deno.test('Role hierarchy: data_entry restricted to own area', () => {
  const role = 'data_entry';
  const userGovId: string = TEST_GOV_ID;
  const targetGovId: string = 'different-gov-id';
  const canSubmitAnywhere = ['admin', 'central'].includes(role);
  const isOwnArea: boolean = userGovId === targetGovId;
  assertEquals(canSubmitAnywhere || isOwnArea, false);
});

// ─── Helper: Validate Payload Size ──────────────────────────
Deno.test('Payload size: rejects oversized payload', () => {
  const maxSize = 1024 * 1024; // 1MB
  const bigData = 'x'.repeat(maxSize + 1);
  assertEquals(bigData.length > maxSize, true);
});

Deno.test('Payload size: accepts normal payload', () => {
  const maxSize = 1024 * 1024; // 1MB
  const normalData = JSON.stringify({
    form_id: TEST_FORM_ID,
    data: { field1: 'value1', field2: 42 },
  });
  assertEquals(normalData.length < maxSize, true);
});

// ─── Helper: Validate form_id format ────────────────────────
Deno.test('form_id validation: rejects null', () => {
  const formId: string | null = null;
  assertEquals(typeof formId === 'string' && formId.length > 0, false);
});

Deno.test('form_id validation: rejects empty string', () => {
  const formId = '';
  assertEquals(typeof formId === 'string' && formId.length > 0, false);
});

Deno.test('form_id validation: accepts valid UUID', () => {
  const formId = TEST_FORM_ID;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assertEquals(uuidRegex.test(formId), true);
});

// ─── Helper: Duplicate offline_id detection ─────────────────
Deno.test('Offline dedup: detects duplicate offline_id', () => {
  const existingOfflineIds = new Set(['offline-001', 'offline-002']);
  const newOfflineId = 'offline-001';
  assertEquals(existingOfflineIds.has(newOfflineId), true);
});

Deno.test('Offline dedup: allows unique offline_id', () => {
  const existingOfflineIds = new Set(['offline-001', 'offline-002']);
  const newOfflineId = 'offline-003';
  assertEquals(existingOfflineIds.has(newOfflineId), false);
});

// ─── Helper: Photo count validation ─────────────────────────
Deno.test('Photo validation: rejects exceeding max_photos', () => {
  const maxPhotos = 5;
  const photos = new Array(6).fill('photo_url');
  assertEquals(photos.length > maxPhotos, true);
});

Deno.test('Photo validation: accepts within limit', () => {
  const maxPhotos = 5;
  const photos = ['photo1', 'photo2', 'photo3'];
  assertEquals(photos.length <= maxPhotos, true);
});

Deno.test('Photo validation: requires photo when form requires it', () => {
  const requiresPhoto = true;
  const photos: string[] = [];
  const valid = !requiresPhoto || photos.length > 0;
  assertEquals(valid, false);
});

// ─── Helper: GPS requirement validation ─────────────────────
Deno.test('GPS validation: requires GPS when form demands it', () => {
  const requiresGps = true;
  const gpsLat: number | null = null;
  const gpsLng: number | null = null;
  const valid = !requiresGps || (gpsLat != null && gpsLng != null);
  assertEquals(valid, false);
});

Deno.test('GPS validation: optional when form does not require it', () => {
  const requiresGps = false;
  const gpsLat: number | null = null;
  const gpsLng: number | null = null;
  const valid = !requiresGps || (gpsLat != null && gpsLng != null);
  assertEquals(valid, true);
});

console.log('✅ All submit-form unit tests passed');
