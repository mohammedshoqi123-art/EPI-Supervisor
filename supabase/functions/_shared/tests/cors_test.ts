/**
 * Tests for CORS — Cross-Origin Resource Sharing
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// Simulated CORS logic
function getCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const base = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (allowedOrigins.length === 0) {
    if (!origin) {
      return { ...base, 'Access-Control-Allow-Origin': '*' };
    }
    return { ...base, 'Access-Control-Allow-Origin': 'null', 'Vary': 'Origin' };
  }

  const allowed = origin && allowedOrigins.includes(origin) ? origin : 'null';
  return { ...base, 'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin' };
}

Deno.test('CORS — no origin header (mobile app) gets wildcard', () => {
  const headers = getCorsHeaders(null, []);
  assertEquals(headers['Access-Control-Allow-Origin'], '*');
});

Deno.test('CORS — origin header with no allowlist gets blocked', () => {
  const headers = getCorsHeaders('https://evil.com', []);
  assertEquals(headers['Access-Control-Allow-Origin'], 'null');
});

Deno.test('CORS — allowed origin passes', () => {
  const headers = getCorsHeaders('https://example.com', ['https://example.com']);
  assertEquals(headers['Access-Control-Allow-Origin'], 'https://example.com');
});

Deno.test('CORS — disallowed origin blocked', () => {
  const headers = getCorsHeaders('https://evil.com', ['https://example.com']);
  assertEquals(headers['Access-Control-Allow-Origin'], 'null');
});

Deno.test('CORS — multiple allowed origins', () => {
  const allowed = ['https://a.com', 'https://b.com', 'https://c.com'];
  assertEquals(getCorsHeaders('https://b.com', allowed)['Access-Control-Allow-Origin'], 'https://b.com');
  assertEquals(getCorsHeaders('https://evil.com', allowed)['Access-Control-Allow-Origin'], 'null');
});

Deno.test('CORS — headers include required fields', () => {
  const headers = getCorsHeaders(null, []);
  assertEquals(headers['Access-Control-Allow-Headers'], 'authorization, x-client-info, apikey, content-type');
  assertEquals(headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

Deno.test('CORS — Vary header set when origin checked', () => {
  const headers = getCorsHeaders('https://example.com', ['https://example.com']);
  assertEquals(headers['Vary'], 'Origin');
});
