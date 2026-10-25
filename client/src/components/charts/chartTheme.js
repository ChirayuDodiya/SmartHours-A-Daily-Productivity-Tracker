/** Shared palette and Recharts tuning for consistent, performant, vibrant charts. */
export const CHART_COLORS = [
  '#38bdf8', // Luminous sky
  '#a855f7', // Electric violet
  '#34d399', // Radiant emerald
  '#fbbf24', // Warm amber
  '#818cf8', // Indigo glow
  '#f472b6', // Rose
  '#2dd4bf', // Teal flow
  '#fb923c', // Warm tangerine
]

export const PIE_CONFIG = {
  innerRadius: '62%',
  outerRadius: '86%',
  paddingAngle: 3,
  cx: '50%',
  cy: '50%',
  animationDuration: 400,
  animationEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  animationBegin: 0,
}

export const CHART_HEIGHT = {
  pie: 280,
  bar: 320,
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '0.75rem',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  boxShadow: '0 10px 25px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  fontSize: 13,
  padding: '10px 14px',
}

export const CHART_MARGIN = { top: 16, right: 16, left: -10, bottom: 8 }

export function filterPieData(data) {
  if (!Array.isArray(data)) return []
  const filtered = data.filter((item) => Number(item.total_seconds) > 0)
  const totalSeconds = filtered.reduce((acc, item) => acc + (Number(item.total_seconds) || 0), 0)

  return filtered.map((item) => {
    const secs = Number(item.total_seconds) || 0
    const calculatedPct = totalSeconds > 0 ? Number(((secs / totalSeconds) * 100).toFixed(1)) : 0
    return {
      ...item,
      total_seconds: secs,
      pct: item.pct != null ? Number(item.pct) : calculatedPct,
    }
  })
}

export function pieDataSignature(data) {
  return data
    .map((item) => `${item.task_name ?? ''}:${item.total_seconds ?? 0}:${item.pct ?? 0}`)
    .join('|')
}
