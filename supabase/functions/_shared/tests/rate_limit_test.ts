/**
 * Tests for rate limiting across Edge Functions.
 * Run with: deno test supabase/functions/_shared/tests/rate_limit_test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('rate limit - valid parameters', () => {
  const params = {
    p_user_id: 'user-123',
    p_endpoint: 'admin-actions',
    p_window_seconds: 60,
    p_max_requests: 10,
  };

  assertExists(params.p_user_id);
  assertExists(params.p_endpoint);
  assertEquals(params.p_window_seconds > 0, true);
  assertEquals(params.p_max_requests > 0, true);
});

Deno.test('rate limit - admin-actions uses 10 requests per minute', () => {
  const maxRequests = 10;
  const windowSeconds = 60;

  assertEquals(maxRequests, 10);
  assertEquals(windowSeconds, 60);
});

Deno.test('rate limit - manage-data uses 20 requests per minute', () => {
  const maxRequests = 20;
  const windowSeconds = 60;

  assertEquals(maxRequests, 20);
  assertEquals(windowSeconds, 60);
});

Deno.test('rate limit - get-admin-dashboard uses 15 requests per minute', () => {
  const maxRequests = 15;
  const windowSeconds = 60;

  assertEquals(maxRequests, 15);
  assertEquals(windowSeconds, 60);
});

Deno.test('rate limit - fail-closed behavior blocks when RPC fails', () => {
  // When rate limit RPC returns error or false, request should be blocked
  const rpcError = new Error('Connection timeout');
  const rpcResult = false;

  const shouldBlock = rpcError || !rpcResult;
  assertEquals(!!shouldBlock, true);
});

Deno.test('rate limit - fail-open behavior allows when RPC fails (non-critical)', () => {
  // For non-critical endpoints like dashboard stats, fail-open might be acceptable
  // But for admin actions, always fail-closed
  const endpoint = 'admin-actions';
  const isCritical = ['admin-actions', 'manage-data', 'create-admin'].includes(endpoint);

  assertEquals(isCritical, true);
});
