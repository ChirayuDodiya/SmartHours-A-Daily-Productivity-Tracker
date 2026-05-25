import { memo } from 'react'
import { formatDuration } from '@/utils/helpers'

function TooltipCard({ children }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md">
      {children}
    </div>
  )
}

function TooltipRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

export const AnalyticsPieTooltip = memo(function AnalyticsPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const percent = item.percent != null ? (item.percent * 100).toFixed(1) : '0.0'
  const pts = item.payload?.points
  return (
    <TooltipCard>
      <p className="mb-2 border-b border-border pb-1.5 text-sm font-semibold text-foreground">
        {item.name}
      </p>
      <dl className="space-y-1 text-xs">
        <TooltipRow label="Time" value={formatDuration(item.value)} />
        <TooltipRow label="Share" value={`${percent}%`} />
        {pts != null && <TooltipRow label="Points" value={String(pts)} />}
      </dl>
    </TooltipCard>
  )
})

export const DailyPieTooltip = memo(function DailyPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const data = item.payload
  const percent = item.percent != null ? (item.percent * 100).toFixed(1) : data.pct
  return (
    <TooltipCard>
      <p className="mb-2 border-b border-border pb-1.5 text-sm font-semibold text-foreground">
        {data.task_name}
      </p>
      <dl className="space-y-1 text-xs">
        <TooltipRow label="Time" value={formatDuration(data.total_seconds)} />
        <TooltipRow label="Share" value={`${percent}%`} />
        {data.points != null && <TooltipRow label="Points" value={String(data.points)} />}
      </dl>
    </TooltipCard>
  )
})
