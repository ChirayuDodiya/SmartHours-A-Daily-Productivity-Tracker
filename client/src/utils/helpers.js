import { API_URL, DATE_HEADING_FORMATTER } from './constants'

export function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingDays = firstDay.getDay()
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - leadingDays + 1
    const date = new Date(year, month, dayOffset)

    return {
      date,
      key: getDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    }
  })
}

export function getScoreLevel(score) {
  if (!score || score <= 0) {
    return ''
  }

  if (score < 30) {
    return 'red'
  }

  if (score < 40) {
    return 'yellow'
  }

  if (score < 50) {
    return 'green'
  }

  return 'purple'
}

export function getRoutePath() {
  return window.location.pathname
}

export function isFutureDate(dateKey) {
  return dateKey > getDateKey(new Date())
}

export function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export function formatDateHeading(dateKey) {
  return DATE_HEADING_FORMATTER.format(new Date(`${dateKey}T00:00:00`))
}

export function calculatePoints(seconds, weight) {
  return (seconds / 3600) * Number(weight) * 5
}

export function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(
    remainingSeconds,
  ).padStart(2, '0')}s`
}
