import { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import {
  CHART_COLORS,
  PIE_CONFIG,
  CHART_HEIGHT,
  filterPieData,
  pieDataSignature,
} from './chartTheme'
import { DailyPieTooltip, AnalyticsPieTooltip } from './PieChartTooltip'

const LegendContent = memo(function LegendContent({ payload }) {
  if (!payload?.length) return null
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {payload.map((entry) => {
        return (
          <li
            key={entry.value}
            className="flex max-w-[220px] items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="truncate">
              <span className="font-medium text-foreground">{entry.value}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
})

function OptimizedPieChartInner({
  data,
  variant = 'daily',
  height = CHART_HEIGHT.pie,
  className,
}) {
  const chartData = useMemo(() => filterPieData(data), [data])
  const dataKey = useMemo(() => pieDataSignature(chartData), [chartData])
  const TooltipContent = variant === 'analytics' ? AnalyticsPieTooltip : DailyPieTooltip

  if (chartData.length === 0) {
    return null
  }

  return (
    <div
      className={cn('w-full min-w-0', className)}
      style={{ height }}
      role="img"
      aria-label="Task time breakdown chart"
    >
      <ResponsiveContainer width="100%" height="100%" debounce={32}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            key={dataKey}
            data={chartData}
            dataKey="total_seconds"
            nameKey="task_name"
            cx={PIE_CONFIG.cx}
            cy={PIE_CONFIG.cy}
            innerRadius={PIE_CONFIG.innerRadius}
            outerRadius={PIE_CONFIG.outerRadius}
            paddingAngle={PIE_CONFIG.paddingAngle}
            isAnimationActive
            animationDuration={PIE_CONFIG.animationDuration}
            animationEasing={PIE_CONFIG.animationEasing}
            animationBegin={PIE_CONFIG.animationBegin}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.task_name ?? index}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<TooltipContent />} isAnimationActive={false} />
          <Legend verticalAlign="bottom" content={<LegendContent />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

const OptimizedPieChart = memo(OptimizedPieChartInner)
export default OptimizedPieChart
