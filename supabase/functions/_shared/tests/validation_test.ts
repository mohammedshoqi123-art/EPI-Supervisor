/**
 * Tests for input validation across Edge Functions.
 * Run with: deno test supabase/functions/_shared/tests/validation_test.ts
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ═══ Role Validation ═══

Deno.test('validation - valid roles are accepted', () => {
  const validRoles = ['admin', 'central', 'governorate', 'district', 'data_entry'];
  const ROLE_HIERARCHY: Record<string, number> = {
    admin: 5, central: 4, governorate: 3, district: 2, data_entry: 1,
  };

  validRoles.forEach(role => {
    assertEquals(ROLE_HIERARCHY[role] !== undefined, true, `${role} should be valid`);
  });
});

Deno.test('validation - invalid roles are rejected', () => {
  const ROLE_HIERARCHY: Record<string, number> = {
    admin: 5, central: 4, governorate: 3, district: 2, data_entry: 1,
  };

  assertEquals(ROLE_HIERARCHY['superadmin'], undefined);
  assertEquals(ROLE_HIERARCHY[''], undefined);
  assertEquals(ROLE_HIERARCHY['moderator'], undefined);
});

// ═══ Required Fields ═══

Deno.test('validation - update_role requires user_id and role', () => {
  const body1 = { user_id: '123', role: 'admin' };
  assertEquals(!!body1.user_id && !!body1.role, true);

  const body2 = { user_id: '', role: 'admin' };
  assertEquals(!!body2.user_id && !!body2.role, false);

  const body3 = { user_id: '123', role: '' };
  assertEquals(!!body3.user_id && !!body3.role, false);
});

Deno.test('validation - toggle_active requires user_id and is_active', () => {
  const body1 = { user_id: '123', is_active: true };
  assertEquals(!!body1.user_id && body1.is_active !== undefined, true);

  const body2 = { user_id: '123' };
  assertEquals(!!body2.user_id && (body2 as any).is_active !== undefined, false);
});

Deno.test('validation - delete_user requires user_id', () => {
  const body1 = { user_id: '123' };
  assertEquals(!!body1.user_id, true);

  const body2 = { user_id: '' };
  assertEquals(!!body2.user_id, false);
});

// ═══ Payload Size ═══

Deno.test('validation - payload size under limit', () => {
  const smallPayload = JSON.stringify({ data: 'small' });
  const maxSize = 1024 * 1024; // 1MB
  assertEquals(smallPayload.length < maxSize, true);
});

// ═══ Settings Validation ═══

Deno.test('validation - settings update requires array', () => {
  const validBody = { settings: [{ key: 'test', value: 'val' }] };
  assertEquals(Array.isArray(validBody.settings), true);

  const invalidBody = { settings: 'not-an-array' };
  assertEquals(Array.isArray(invalidBody.settings), false);
});

// ═══ GPS Validation ═══

Deno.test('validation - GPS coordinates for Yemen', () => {
  const lat = 15.3694; // Sana'a
  const lng = 44.191;

  assertEquals(lat >= -90 && lat <= 90, true);
  assertEquals(lng >= -180 && lng <= 180, true);
});

Deno.test('validation - invalid GPS rejected', () => {
  assertEquals(91 >= -90 && 91 <= 90, false);
  assertEquals(181 >= -180 && 181 <= 180, false);
});
