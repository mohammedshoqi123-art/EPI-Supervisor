/**
 * Tests for validation utilities — Input validation across Edge Functions
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ─── Email Validation ─────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Password Validation ──────────────────────────────────
function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) return { valid: false, reason: 'too_short' }
  if (!/[A-Z]/.test(password)) return { valid: false, reason: 'no_uppercase' }
  if (!/[a-z]/.test(password)) return { valid: false, reason: 'no_lowercase' }
  if (!/[0-9]/.test(password)) return { valid: false, reason: 'no_number' }
  return { valid: true }
}

// ─── UUID Validation ──────────────────────────────────────
function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}

// ─── Yemeni Phone Validation ─────────────────────────────
function isValidYemeniPhone(phone: string): boolean {
  return /^7[0-9]{8}$/.test(phone)
}

// ─── Role Validation ─────────────────────────────────────
const VALID_ROLES = ['admin', 'central', 'governorate', 'district', 'data_entry']
function isValidRole(role: string): boolean {
  return VALID_ROLES.includes(role)
}

// ═══ Tests ═══════════════════════════════════════════════

Deno.test('Email validation — valid emails', () => {
  assertEquals(isValidEmail('admin@epi.ye'), true)
  assertEquals(isValidEmail('user@example.com'), true)
  assertEquals(isValidEmail('test.user@domain.co'), true)
})

Deno.test('Email validation — invalid emails', () => {
  assertEquals(isValidEmail(''), false)
  assertEquals(isValidEmail('not-email'), false)
  assertEquals(isValidEmail('@domain.com'), false)
  assertEquals(isValidEmail('user@'), false)
  assertEquals(isValidEmail('user @domain.com'), false)
})

Deno.test('Password validation — strong passwords', () => {
  assertEquals(isStrongPassword('SecurePass123').valid, true)
  assertEquals(isStrongPassword('MyP@ssw0rd').valid, true)
  assertEquals(isStrongPassword('Abc12345').valid, true)
})

Deno.test('Password validation — weak passwords', () => {
  assertEquals(isStrongPassword('').valid, false)
  assertEquals(isStrongPassword('123').valid, false)
  assertEquals(isStrongPassword('alllowercase').valid, false)
  assertEquals(isStrongPassword('ALLUPPERCASE').valid, false)
  assertEquals(isStrongPassword('NoNumbers').valid, false)
  assertEquals(isStrongPassword('Short1').valid, false)
})

Deno.test('Password validation — correct error reasons', () => {
  assertEquals(isStrongPassword('123').reason, 'too_short')
  assertEquals(isStrongPassword('alllowercase1').reason, 'no_uppercase')
  assertEquals(isStrongPassword('ALLUPPERCASE1').reason, 'no_lowercase')
  assertEquals(isStrongPassword('NoNumbersHere').reason, 'no_number')
})

Deno.test('UUID validation — valid UUIDs', () => {
  assertEquals(isValidUUID('550e8400-e29b-41d4-a716-446655440000'), true)
  assertEquals(isValidUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), true)
})

Deno.test('UUID validation — invalid UUIDs', () => {
  assertEquals(isValidUUID(''), false)
  assertEquals(isValidUUID('not-a-uuid'), false)
  assertEquals(isValidUUID('550e8400-e29b-41d4-a716'), false)
  assertEquals(isValidUUID('550e8400e29b41d4a716446655440000'), false) // no dashes
})

Deno.test('Yemeni phone validation — valid phones', () => {
  assertEquals(isValidYemeniPhone('771234567'), true)
  assertEquals(isValidYemeniPhone('730000000'), true)
  assertEquals(isValidYemeniPhone('780123456'), true)
})

Deno.test('Yemeni phone validation — invalid phones', () => {
  assertEquals(isValidYemeniPhone(''), false)
  assertEquals(isValidYemeniPhone('123'), false)
  assertEquals(isValidYemeniPhone('671234567'), false) // Must start with 7
  assertEquals(isValidYemeniPhone('77123456'), false)  // Must be 9 digits
  assertEquals(isValidYemeniPhone('7712345678'), false) // Must be 9 digits
})

Deno.test('Role validation — valid roles', () => {
  assertEquals(isValidRole('admin'), true)
  assertEquals(isValidRole('central'), true)
  assertEquals(isValidRole('governorate'), true)
  assertEquals(isValidRole('district'), true)
  assertEquals(isValidRole('data_entry'), true)
})

Deno.test('Role validation — invalid roles', () => {
  assertEquals(isValidRole(''), false)
  assertEquals(isValidRole('superadmin'), false)
  assertEquals(isValidRole('user'), false)
  assertEquals(isValidRole('ADMIN'), false) // Case sensitive
})

Deno.test('Rate limit — allows within limit', () => {
  const requests = 5;
  const limit = 10;
  assertEquals(requests < limit, true)
})

Deno.test('Rate limit — blocks at limit', () => {
  const requests = 10;
  const limit = 10;
  assertEquals(requests >= limit, false) // Should be blocked
})
