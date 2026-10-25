import { memo } from 'react'
import { formatDuration } from '@/utils/helpers'

function TooltipCard({ children }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      {children}
    </div>
  )
}

export const AnalyticsPieTooltip = memo(function AnalyticsPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const data = item.payload || {}
  const rawPct = data.pct != null ? data.pct : (item.percent != null ? item.percent * 100 : null)
  const percent = rawPct != null && !isNaN(rawPct) ? Number(rawPct).toFixed(1) : '0.0'
  const pts = data.points
  return (
    <TooltipCard>
      <p className="mb-1 text-sm font-semibold tracking-tight text-foreground">
        {item.name || data.task_name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-primary font-mono-numbers">
          {percent}%
        </span>
        <span className="text-xs text-muted-foreground">share</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{formatDuration(item.value || data.total_seconds)}</span>
        {pts != null && (
          <span className="font-semibold text-foreground/90 font-mono-numbers">
            +{pts} pts
          </span>
        )}
      </div>
    </TooltipCard>
  )
})

export const DailyPieTooltip = memo(function DailyPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const data = item.payload || {}
  const rawPct = data.pct != null ? data.pct : (item.percent != null ? item.percent * 100 : null)
  const percent = rawPct != null && !isNaN(rawPct) ? Number(rawPct).toFixed(1) : '0.0'
  return (
    <TooltipCard>
      <p className="mb-1 text-sm font-semibold tracking-tight text-foreground">
        {data.task_name || item.name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-primary font-mono-numbers">
          {percent}%
        </span>
        <span className="text-xs text-muted-foreground">of today</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{formatDuration(data.total_seconds || item.value)}</span>
        {data.points != null && (
          <span className="font-semibold text-foreground/90 font-mono-numbers">
            +{data.points} pts
          </span>
        )}
      </div>
    </TooltipCard>
  )
})
