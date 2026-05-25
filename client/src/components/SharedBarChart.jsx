import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CHART_HEIGHT, CHART_MARGIN, CHART_TOOLTIP_STYLE } from './charts/chartTheme'

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

function SharedBarChartInner({ data, isLoading, activeTab }) {
  const xKey = activeTab === 'yearly' ? 'month' : 'date'
  const tickFormatter = useMemo(
    () => (tick) => formatXAxis(tick, activeTab),
    [activeTab],
  )

  if (isLoading || !data?.length) {
    return null
  }

  return (
    <div className="w-full min-w-0" style={{ height: CHART_HEIGHT.bar }}>
      <ResponsiveContainer width="100%" height="100%" debounce={32}>
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xKey}
            tickFormatter={tickFormatter}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--primary) / 0.06)' }}
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={(label) => `Date: ${label}`}
            isAnimationActive={false}
          />
          <Bar
            dataKey="total_points"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
            name="Points"
            isAnimationActive
            animationDuration={380}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const SharedBarChart = memo(SharedBarChartInner)
export default SharedBarChart
