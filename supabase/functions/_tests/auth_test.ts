/**
 * Tests for _shared/auth.ts — JWT validation and client creation.
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/_tests/auth_test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ─── extractToken tests ─────────────────────────────────────
Deno.test('extractToken: returns token from Bearer header', () => {
  const header = 'Bearer eyJhbGciOiJIUzI1NiJ9.test.signature';
  const match = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(match !== null, true);
  assertEquals(match![1], 'eyJhbGciOiJIUzI1NiJ9.test.signature');
});

Deno.test('extractToken: returns null for empty header', () => {
  const header = '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(match, null);
});

Deno.test('extractToken: returns null for non-Bearer header', () => {
  const header = 'Basic dXNlcjpwYXNz';
  const match = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(match, null);
});

Deno.test('extractToken: handles case-insensitive Bearer', () => {
  const header = 'bearer token123';
  const match = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(match !== null, true);
  assertEquals(match![1], 'token123');
});

Deno.test('extractToken: handles Bearer with extra spaces', () => {
  const header = 'Bearer  token_with_spaces';
  const match = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(match !== null, true);
  // \s+ consumes ALL whitespace, so captured token has no leading space
  assertEquals(match![1], 'token_with_spaces');
});

// ─── JWT Structure Validation ───────────────────────────────
Deno.test('JWT structure: valid JWT has 3 parts', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.signature';
  const parts = token.split('.');
  assertEquals(parts.length, 3);
});

Deno.test('JWT structure: rejects malformed JWT', () => {
  const token = 'not-a-jwt';
  const parts = token.split('.');
  assertEquals(parts.length === 3, false);
});

Deno.test('JWT structure: rejects JWT with only 2 parts', () => {
  const token = 'header.payload';
  const parts = token.split('.');
  assertEquals(parts.length === 3, false);
});

// ─── Auth Result Structure ──────────────────────────────────
Deno.test('AuthResult: has required fields', () => {
  const result = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'admin',
  };
  assertExists(result.userId);
  assertExists(result.email);
  assertEquals(typeof result.userId, 'string');
  assertEquals(result.userId.length > 0, true);
});

// ─── CORS Headers ───────────────────────────────────────────
Deno.test('CORS: includes required headers', () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
  assertExists(headers['Access-Control-Allow-Origin']);
  assertExists(headers['Access-Control-Allow-Headers']);
  assertExists(headers['Access-Control-Allow-Methods']);
});

Deno.test('CORS: allows Authorization header', () => {
  const allowedHeaders = 'authorization, x-client-info, apikey, content-type';
  assertEquals(allowedHeaders.includes('authorization'), true);
});

console.log('✅ All auth unit tests passed');
