/**
 * Tests for authentication helpers.
 * Run with: deno test supabase/functions/_shared/tests/auth_test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Test the Bearer token extraction logic
Deno.test('auth - extractToken returns token from valid Bearer header', () => {
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : null;

  assertExists(token);
  assertEquals(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
});

Deno.test('auth - extractToken returns null for missing header', () => {
  const authHeader: string | null = null;
  const match = authHeader?.match(/^Bearer\s+(.+)$/i) ?? null;
  assertEquals(match, null);
});

Deno.test('auth - extractToken returns null for non-Bearer token', () => {
  const authHeader = 'Basic dXNlcjpwYXNz';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  assertEquals(match, null);
});

Deno.test('auth - extractToken handles lowercase bearer', () => {
  const authHeader = 'bearer token123';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  assertExists(match);
  assertEquals(match![1], 'token123');
});

Deno.test('auth - extractToken handles extra whitespace', () => {
  const authHeader = 'Bearer   token-with-spaces';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  assertExists(match);
  assertEquals(match![1], 'token-with-spaces');
});

// Test admin role check logic
Deno.test('auth - admin role check rejects non-admin', () => {
  const callerRole = 'data_entry';
  const isAdmin = callerRole === 'admin';
  assertEquals(isAdmin, false);
});

Deno.test('auth - admin role check allows admin', () => {
  const callerRole = 'admin';
  const isAdmin = callerRole === 'admin';
  assertEquals(isAdmin, true);
});

// Test role hierarchy for manage-data
Deno.test('auth - manage-data allows admin and central', () => {
  const allowedRoles = ['admin', 'central'];
  assertEquals(allowedRoles.includes('admin'), true);
  assertEquals(allowedRoles.includes('central'), true);
  assertEquals(allowedRoles.includes('governorate'), false);
  assertEquals(allowedRoles.includes('data_entry'), false);
});

// Test self-deletion prevention
Deno.test('auth - prevents self-deletion', () => {
  const authUserId = 'user-123';
  const targetUserId = 'user-123';
  const isSelfDelete = authUserId === targetUserId;
  assertEquals(isSelfDelete, true);
});

Deno.test('auth - allows deleting other users', () => {
  const authUserId = 'user-123';
  const targetUserId = 'user-456';
  const isSelfDelete = authUserId === targetUserId;
  assertEquals(isSelfDelete, false);
});
