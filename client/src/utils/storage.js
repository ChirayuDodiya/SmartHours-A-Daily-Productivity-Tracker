// Safe storage utility with in-memory fallback for Brave / Incognito / restricted environments

const memoryStore = new Map()

export function safeGet(key, defaultValue = null) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key)
      return val !== null ? val : defaultValue
    }
  } catch {
    // Brave Shields / Incognito access denied
  }
  return memoryStore.has(key) ? memoryStore.get(key) : defaultValue
}

export function safeSet(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, String(value))
      return
    }
  } catch {
    // Fall back to memory
  }
  memoryStore.set(key, String(value))
}

export function safeRemove(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Fall back to memory
  }
  memoryStore.delete(key)
}

export const TOKEN_KEY = 'smarthours_auth_token'

export function getStoredToken() {
  return safeGet(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) {
    safeSet(TOKEN_KEY, token)
  } else {
    safeRemove(TOKEN_KEY)
  }
}

export function removeStoredToken() {
  safeRemove(TOKEN_KEY)
}
