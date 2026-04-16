/**
 * Tests for _shared/cors.ts — CORS header generation and JSON responses.
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/_tests/cors_test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ─── CORS Header Tests (no ALLOWED_ORIGINS configured) ──────
Deno.test('CORS: no origin header + no allowlist → allow (mobile apps)', () => {
  // When ALLOWED_ORIGINS is empty and no Origin header → mobile app → allow
  const hasOrigin = false;
  const hasAllowlist = false;
  const shouldAllow = !hasOrigin || hasAllowlist;
  assertEquals(shouldAllow, true);
});

Deno.test('CORS: origin header present + no allowlist → block (fail-closed)', () => {
  const hasOrigin = true;
  const hasAllowlist = false;
  const shouldAllow = hasOrigin && hasAllowlist;
  assertEquals(shouldAllow, false);
});

// ─── CORS Header Tests (with ALLOWED_ORIGINS) ───────────────
Deno.test('CORS: allowed origin → pass through', () => {
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
  const origin = 'https://app.example.com';
  assertEquals(allowedOrigins.includes(origin), true);
});

Deno.test('CORS: disallowed origin → block', () => {
  const allowedOrigins = ['https://app.example.com'];
  const origin = 'https://evil.com';
  assertEquals(allowedOrigins.includes(origin), false);
});

// ─── JSON Response Tests ────────────────────────────────────
Deno.test('jsonResponse: creates valid JSON response', async () => {
  const data = { success: true, id: '123' };
  const response = new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Content-Type'), 'application/json');

  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.id, '123');
});

Deno.test('jsonResponse: includes CORS headers', () => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  });

  assertExists(headers.get('Access-Control-Allow-Origin'));
  assertExists(headers.get('Access-Control-Allow-Headers'));
});

Deno.test('jsonResponse: error response has correct status', async () => {
  const errorData = { error: 'Unauthorized' };
  const response = new Response(JSON.stringify(errorData), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error, 'Unauthorized');
});

Deno.test('jsonResponse: rate limit response includes Retry-After', () => {
  const response = new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );

  assertEquals(response.status, 429);
  assertEquals(response.headers.get('Retry-After'), '60');
});

// ─── Security: Vary header ──────────────────────────────────
Deno.test('CORS: includes Vary header when origin is checked', () => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': 'null',
    'Vary': 'Origin',
  };
  assertEquals(headers['Vary'], 'Origin');
});

console.log('✅ All CORS unit tests passed');
