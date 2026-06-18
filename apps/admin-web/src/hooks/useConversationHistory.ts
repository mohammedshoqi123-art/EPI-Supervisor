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
 */
function saveConversation(messages: StoredMessage[]): void {
  try {
    const toSave = messages.slice(-MAX_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Storage full — clear old data
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }
}

/**
 * Hook for managing bot conversation history
 */
export function useConversationHistory() {
  const [messages, setMessages] = useState<StoredMessage[]>(loadConversation)

  // Save whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(messages)
    }
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
