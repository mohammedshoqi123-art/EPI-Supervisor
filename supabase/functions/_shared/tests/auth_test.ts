/**
 * Tests for auth.ts — Authentication and IP extraction
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { getClientIp, extractToken } from '../auth.ts'

Deno.test('getClientIp — extracts from x-forwarded-for', () => {
  const req = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
  })
  assertEquals(getClientIp(req), '192.168.1.1')
})

Deno.test('getClientIp — extracts from x-real-ip', () => {
  const req = new Request('http://localhost', {
    headers: { 'x-real-ip': '10.0.0.5' },
  })
  assertEquals(getClientIp(req), '10.0.0.5')
})

Deno.test('getClientIp — returns unknown when no headers', () => {
  const req = new Request('http://localhost')
  assertEquals(getClientIp(req), 'unknown')
})

Deno.test('getClientIp — prefers x-forwarded-for over x-real-ip', () => {
  const req = new Request('http://localhost', {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'x-real-ip': '10.0.0.5',
    },
  })
  assertEquals(getClientIp(req), '192.168.1.1')
})

Deno.test('extractToken — extracts Bearer token', () => {
  assertEquals(extractToken('Bearer abc123'), 'abc123')
  assertEquals(extractToken('bearer abc123'), 'abc123')
})

Deno.test('extractToken — returns null for invalid format', () => {
  assertEquals(extractToken('Basic abc123'), null)
  assertEquals(extractToken(''), null)
  assertEquals(extractToken(null), null)
})

Deno.test('extractToken — handles token with special chars', () => {
  assertEquals(extractToken('Bearer eyJhbGciOiJIUzI1NiJ9.token-here'), 'eyJhbGciOiJIUzI1NiJ9.token-here')
})
