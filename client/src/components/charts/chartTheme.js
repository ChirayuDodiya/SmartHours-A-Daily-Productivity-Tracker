/** Shared palette and Recharts tuning for consistent, performant charts. */
export const CHART_COLORS = [
  'hsl(192 45% 45%)',
  'hsl(262 52% 55%)',
  'hsl(142 55% 45%)',
  'hsl(38 80% 50%)',
  'hsl(199 70% 48%)',
  'hsl(346 65% 55%)',
  'hsl(221 60% 55%)',
  'hsl(168 55% 42%)',
]

export const PIE_CONFIG = {
  innerRadius: '58%',
  outerRadius: '82%',
  paddingAngle: 2,
  cx: '50%',
  cy: '46%',
  /** Short, GPU-friendly entrance; avoids long fill lag. */
  animationDuration: 380,
  animationEasing: 'ease-out',
  animationBegin: 0,
}

export const CHART_HEIGHT = {
  pie: 340,
  bar: 320,
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '0.625rem',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  boxShadow: '0 4px 12px hsl(222 47% 11% / 0.08)',
  fontSize: 13,
}

export const CHART_MARGIN = { top: 12, right: 16, left: 0, bottom: 8 }

export function filterPieData(data) {
  if (!Array.isArray(data)) return []
  return data.filter((item) => Number(item.total_seconds) > 0)
}

export function pieDataSignature(data) {
  return data
    .map((item) => `${item.task_name ?? ''}:${item.total_seconds ?? 0}`)
    .join('|')
}
