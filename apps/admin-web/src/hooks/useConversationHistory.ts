// ═══════════════════════════════════════════════════════════════
// Conversation History Hook — Persistent Bot Chat
// تاريخ المحادثات — حفظ محادثة البوت محلياً
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'

interface StoredMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  timestamp: number
  intent?: string
  source?: string
}

const STORAGE_KEY = 'epi-bot-conversation'
const MAX_MESSAGES = 100 // Keep last 100 messages
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Load conversation from localStorage
 */
function loadConversation(): StoredMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const messages: StoredMessage[] = JSON.parse(raw)

    // Filter out old messages
    const cutoff = Date.now() - MAX_AGE_MS
    const recent = messages.filter(m => m.timestamp > cutoff)

    // Keep only last N messages
    return recent.slice(-MAX_MESSAGES)
  } catch {
    return []
  }
}

/**
 * Save conversation to localStorage
 * ═══ FIX R-C7: Progressive cleanup instead of full deletion ═══
 * Previously: localStorage.removeItem(STORAGE_KEY) on QuotaExceededError
 *   → entire conversation history deleted
 * Now: remove oldest 20 messages, then retry
 */
function saveConversation(messages: StoredMessage[]): void {
  try {
    const toSave = messages.slice(-MAX_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
      // Storage full — try progressive cleanup
      try {
        // Remove oldest 20 messages and retry
        const reduced = messages.slice(-Math.max(20, messages.length - 20))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced))
      } catch {
        // Still failing — try with just last 10 messages
        try {
          const minimal = messages.slice(-10)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
        } catch {
          // Nothing we can do — but DON'T delete the key
          console.warn('[ConversationHistory] Could not save — storage full')
        }
      }
    }
  }
}

/**
 * Hook for managing bot conversation history
 */
export function useConversationHistory() {
  const [messages, setMessages] = useState<StoredMessage[]>(loadConversation)

  // Save whenever messages change
  // ═══ FIX R-C7: Debounce saves to avoid excessive localStorage writes ═══
  // Previously: saved on EVERY message change → slow on rapid conversations
  // Now: debounced 2000ms → saves once after user stops typing
  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      saveConversation(messages)
    }, 2000)
    return () => clearTimeout(timer)
  }, [messages])

  const addMessage = useCallback((msg: Omit<StoredMessage, 'timestamp'> & { timestamp?: number }) => {
    setMessages(prev => [...prev, {
      ...msg,
      timestamp: msg.timestamp || Date.now(),
    }])
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [])

  const getRecentContext = useCallback((count: number = 10): StoredMessage[] => {
    return messages.slice(-count)
  }, [messages])

  return {
    messages,
    setMessages,
    addMessage,
    clearHistory,
    getRecentContext,
    hasHistory: messages.length > 0,
  }
}
