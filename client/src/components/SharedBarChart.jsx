import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { CHART_MARGIN } from './charts/chartTheme'
import { formatDuration } from '@/utils/helpers'
import { cn } from '@/lib/utils'

function formatXAxis(tickItem, activeTab) {
  if (activeTab === 'weekly' || activeTab === 'monthly') {
    if (!tickItem) return ''
    const parts = tickItem.split('-')
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`
    }
  }
  if (activeTab === 'yearly' && tickItem) {
    const parts = tickItem.split('-')
    if (parts.length === 2) {
      const date = new Date(parts[0], parseInt(parts[1], 10) - 1)
      return date.toLocaleString('default', { month: 'short' })
    }
  }
  return tickItem
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const points = Number(data.total_points) || 0
  const seconds = Number(data.total_seconds) || 0

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-foreground font-mono-numbers">
          {points.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
      {seconds > 0 && (
        <p className="mt-1 text-xs text-primary font-mono-numbers font-medium">
          {formatDuration(seconds)} focused
        </p>
      )}
    </div>
  )
}

function SharedBarChartInner({
  data,
  isLoading,
  activeTab,
  height = '100%',
  className,
}) {
  const xKey = activeTab === 'yearly' ? 'month' : 'date'
  const tickFormatter = useMemo(
    () => (tick) => formatXAxis(tick, activeTab),
    [activeTab],
  )

  if (isLoading || !data?.length) {
    return null
  }

  return (
    <div
      className={cn('w-full h-full min-w-0 min-h-0', className)}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={32}>
        <BarChart
          data={data}
          margin={{
            top: CHART_MARGIN.top,
            right: 36,
            left: CHART_MARGIN.left,
            bottom: CHART_MARGIN.bottom,
          }}
        >
          <defs>
            <linearGradient id="primaryBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.7)" />
          <XAxis
            dataKey={xKey}
            tickFormatter={tickFormatter}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
            width={40}
          />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.08)' }} />
          {/* Daily target reference line at 40 points */}
          {(activeTab === 'weekly' || activeTab === 'monthly') && (
            <ReferenceLine
              y={40}
              stroke="hsl(var(--success))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '40 pts Target',
                position: 'right',
                fill: 'hsl(var(--success))',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
          <Bar
            dataKey="total_points"
            fill="url(#primaryBarGrad)"
            radius={[6, 6, 0, 0]}
            name="Points"
            isAnimationActive
            animationDuration={450}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const SharedBarChart = memo(SharedBarChartInner)
export default SharedBarChart
