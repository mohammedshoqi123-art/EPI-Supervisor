// ═══════════════════════════════════════════════════════════
// EPI Copilot — Smart Escalation Engine (Patent-Pending)
// ═══════════════════════════════════════════════════════════
//
// Innovation #4: Detects frustrated users and intelligently
// escalates their queries to the BEST provider (bypassing tier order)
//
// Signals tracked:
// 1. User sends 3+ messages in <60s → likely frustrated
// 2. User types "ما زبط", "ما يشتغل", "فشل", "مش شغال" → frustration keywords
// 3. User repeats similar question 3+ times → unsatisfied
// 4. User clicks thumbs-down 2+ times in session → unhappy
// 5. AI response latency >10s for 2 consecutive → user impatient
//
// When escalation triggers:
// - Skip Pollinations (less reliable) → use Groq directly
// - Add apologetic prefix to response
// - Offer human-handoff option (if available)
// - Track pattern for future prevention
// ═══════════════════════════════════════════════════════════

interface UserSession {
  userId: string
  messageTimestamps: number[]
  frustrations: number
  thumbsDowns: number
  similarQuestions: Map<string, number>
  lastHighLatency: number
  escalated: boolean
  escalationReason?: string
}

const _sessions = new Map<string, UserSession>()
const SESSION_TTL = 30 * 60 * 1000  // 30 minutes

function getSession(userId: string): UserSession {
  let s = _sessions.get(userId)
  if (!s) {
    s = {
      userId,
      messageTimestamps: [],
      frustrations: 0,
      thumbsDowns: 0,
      similarQuestions: new Map(),
      lastHighLatency: 0,
      escalated: false,
    }
    _sessions.set(userId, s)
  }
  return s
}

// ─── Frustration Keywords (Arabic + English) ───
const FRUSTRATION_KEYWORDS = [
  // Arabic — informal
  'ما زبط', 'ما يشتغل', 'ما يرد', 'فشل', 'مش شغال', 'مو شغال',
  'بطيء', 'بطيئ', 'يتأخر', 'تأخر', 'ما نجح', 'ما ضبط',
  'خربان', 'عطلان', 'علق', 'تعليق',
  // Arabic — formal
  'لا يعمل', 'لا يرد', 'فاشل', 'بطيء جداً', 'متأخر',
  // English
  'not working', 'broken', 'slow', 'timeout', 'failed', 'error',
  // Emoji-based
  '😡', '🤬', '😤', '🙄',
]

const GRATITUDE_KEYWORDS = ['شكرا', 'تسلم', 'ممتاز', 'رائع', 'thank', '👍', '👏']

/**
 * Analyze a user message and update the session.
 * Returns the updated session + escalation recommendation.
 */
export function analyzeUserMessage(
  userId: string,
  message: string,
): {
  session: UserSession
  shouldEscalate: boolean
  reason?: string
  preferredProvider?: string  // bypass tier order if escalation
} {
  const s = getSession(userId)
  const now = Date.now()

  // Clean old timestamps
  s.messageTimestamps = s.messageTimestamps.filter(t => now - t < 60_000)
  s.messageTimestamps.push(now)

  // Check frustration keywords
  const lower = message.toLowerCase()
  const hasFrustration = FRUSTRATION_KEYWORDS.some(k => lower.includes(k.toLowerCase()))
  if (hasFrustration) s.frustrations++

  // Check gratitude (resets some frustration)
  const hasGratitude = GRATITUDE_KEYWORDS.some(k => lower.includes(k.toLowerCase()))
  if (hasGratitude) s.frustrations = Math.max(0, s.frustrations - 1)

  // Track similar questions (normalized)
  const normalized = lower.trim().slice(0, 50)
  const count = (s.similarQuestions.get(normalized) || 0) + 1
  s.similarQuestions.set(normalized, count)

  // ─── Determine escalation ───
  let shouldEscalate = false
  let reason: string | undefined
  let preferredProvider: string | undefined

  // Signal 1: 3+ messages in <60s
  if (s.messageTimestamps.length >= 3 && !s.escalated) {
    shouldEscalate = true
    reason = `rapid_messages (${s.messageTimestamps.length} in 60s)`
    preferredProvider = 'groq'  // best for complex/multi-turn
  }

  // Signal 2: frustration keywords detected
  if (s.frustrations >= 1 && !s.escalated) {
    shouldEscalate = true
    reason = `frustration_keyword (${s.frustrations} detected)`
    preferredProvider = 'groq'
  }

  // Signal 3: repeated same question 3+ times
  if (count >= 3 && !s.escalated) {
    shouldEscalate = true
    reason = `repeated_question (${count}x "${normalized.slice(0, 20)}...")`
    preferredProvider = 'groq'
  }

  // Signal 4: 2+ thumbs-downs in session
  if (s.thumbsDowns >= 2 && !s.escalated) {
    shouldEscalate = true
    reason = `multiple_thumbs_down (${s.thumbsDowns})`
    preferredProvider = 'groq'
  }

  // Signal 5: high latency response (set externally)
  if (s.lastHighLatency >= 2 && !s.escalated) {
    shouldEscalate = true
    reason = `high_latency_responses (${s.lastHighLatency})`
    preferredProvider = 'pollinations'  // fastest
  }

  if (shouldEscalate) {
    s.escalated = true
    s.escalationReason = reason
    console.warn(`[ESCALATION] ⚠️ User ${userId} escalated — reason: ${reason}`)
  }

  return {
    session: s,
    shouldEscalate,
    reason,
    preferredProvider,
  }
}

/**
 * Track a feedback event (thumbs up/down).
 */
export function trackFeedback(userId: string, rating: 'up' | 'down') {
  const s = getSession(userId)
  if (rating === 'down') {
    s.thumbsDowns++
  } else {
    // Reset on positive feedback
    s.thumbsDowns = Math.max(0, s.thumbsDowns - 1)
    s.frustrations = Math.max(0, s.frustrations - 1)
  }
}

/**
 * Track latency for escalation signal.
 */
export function trackLatency(userId: string, latencyMs: number) {
  const s = getSession(userId)
  if (latencyMs > 8000) {
    s.lastHighLatency++
  } else if (latencyMs < 3000) {
    s.lastHighLatency = Math.max(0, s.lastHighLatency - 1)
  }
}

/**
 * Get an apologetic prefix if user is escalated.
 */
export function getEscalationPrefix(session: UserSession): string {
  if (!session.escalated) return ''
  const prefixes = [
    'أعتذر عن التأخير — سأستخدم أفضل مزود متاح الآن:\n\n',
    'سأعطيك أفضل إجابة فورية:\n\n',
    'تم تفعيل الوضع المعزز — إجابة فورية:\n\n',
  ]
  return prefixes[Math.floor(Math.random() * prefixes.length)]
}

/**
 * Clean up expired sessions (call periodically).
 */
export function cleanupSessions() {
  const now = Date.now()
  for (const [userId, s] of _sessions.entries()) {
    const lastActivity = s.messageTimestamps[s.messageTimestamps.length - 1] || 0
    if (now - lastActivity > SESSION_TTL) {
      _sessions.delete(userId)
    }
  }
}

/**
 * Get session stats for debugging/admin UI.
 */
export function getSessionStats(userId: string) {
  const s = _sessions.get(userId)
  if (!s) return null
  return {
    messagesInLastMinute: s.messageTimestamps.length,
    frustrations: s.frustrations,
    thumbsDowns: s.thumbsDowns,
    escalated: s.escalated,
    escalationReason: s.escalationReason,
    uniqueQuestionsAsked: s.similarQuestions.size,
  }
}
