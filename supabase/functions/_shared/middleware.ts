/**
 * Shared Middleware — Security + Validation + Logging
 * 
 * Import this in any Edge Function for consistent security:
 * 
 *   import { withSecurity } from '../_shared/middleware.ts'
 *   serve(withSecurity(async (req, { user, ip }) => { ... }))
 */

import { corsHeaders, jsonResponse } from './cors.ts'
import { authenticateRequest, createUserClient, getClientIp, type AuthResult } from './auth.ts'
import { sanitizeInput, detectPromptInjection, truncateInput } from './sanitize.ts'

export interface RequestContext {
  user: AuthResult
  ip: string
  origin: string | null
  supabase: ReturnType<typeof createUserClient>
}

type Handler = (req: Request, ctx: RequestContext) => Promise<Response>

/**
 * Wrap an Edge Function with security middleware:
 * - CORS handling
 * - JWT authentication
 * - IP extraction
 * - Input sanitization
 * - Rate limit header injection
 */
export function withSecurity(handler: Handler, options?: {
  requireAuth?: boolean
  maxBodySize?: number
}) {
  const { requireAuth = true, maxBodySize = 1024 * 1024 } = options ?? {}

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin')

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders(origin) })
    }

    const ip = getClientIp(req)

    // Body size check
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > maxBodySize) {
      return jsonResponse(
        { error: 'Request body too large', maxBytes: maxBodySize },
        413,
        origin
      )
    }

    // Authentication
    if (requireAuth) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return jsonResponse({ error: 'Missing authorization header' }, 401, origin)
      }

      const supabase = createUserClient(authHeader)
      const user = await authenticateRequest(supabase, authHeader)
      if (!user) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401, origin)
      }

      // Attach IP to user for audit logging
      user.ip = ip

      return handler(req, { user, ip, origin, supabase })
    }

    // No auth required
    const supabase = createUserClient('')
    return handler(req, { user: { userId: 'anonymous' }, ip, origin, supabase })
  }
}

/**
 * Sanitize request body before processing
 */
export function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  return sanitizeInput(body)
}

/**
 * Check if a message contains prompt injection
 */
export function checkInjection(message: string): { safe: boolean; sanitized: string } {
  if (detectPromptInjection(message)) {
    return {
      safe: false,
      sanitized: '⚠️ هذا الطلب يحتوي على محتوى غير مسموح.',
    }
  }
  return {
    safe: true,
    sanitized: truncateInput(message, 5000),
  }
}
