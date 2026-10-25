import { safeGet, safeSet } from './storage'

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const saved = safeGet('smarthours_theme')
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  try {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    safeSet('smarthours_theme', theme)
  } catch {
    // Ignore in restricted environments
  }
}
