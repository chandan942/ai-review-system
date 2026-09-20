import type { ReviewHistoryItem } from './types'

const STORAGE_KEY = 'ai_review_history_v1'
const MAX_HISTORY_ITEMS = 20

export const loadHistoryFromStorage = (): ReviewHistoryItem[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return []
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.warn('Failed to load review history from localStorage:', err)
    return []
  }
}

export const saveHistoryToStorage = (history: ReviewHistoryItem[]): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn('Failed to save review history to localStorage:', err)
  }
}

export const clearHistoryFromStorage = (): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear review history from localStorage:', err)
  }
}
