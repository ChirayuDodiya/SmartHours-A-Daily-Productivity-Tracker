import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiRequest, formatDuration } from '../utils/helpers'
import ChartPanel from './shared/ChartPanel'

const COLORS = [
  'hsl(192 45% 45%)',
  'hsl(262 52% 55%)',
  'hsl(142 55% 45%)',
  'hsl(38 80% 50%)',
  'hsl(199 70% 48%)',
  'hsl(346 65% 55%)',
  'hsl(221 60% 55%)',
  'hsl(168 55% 42%)',
]

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-md">
        <p className="mb-2 border-b border-border pb-1 text-sm font-semibold">{data.task_name}</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex justify-between gap-4">
            <span>Time</span>
            <strong className="text-foreground">{formatDuration(data.total_seconds)}</strong>
          </p>
          <p className="flex justify-between gap-4">
            <span>Share</span>
            <strong className="text-foreground">{data.pct}%</strong>
          </p>
          <p className="flex justify-between gap-4">
            <span>Points</span>
            <strong className="text-foreground">{data.points}</strong>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function DailyPieChart({ date, refreshTrigger }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prevDate, setPrevDate] = useState(date)

  if (date !== prevDate) {
    setPrevDate(date)
    setLoading(true)
  }

  useEffect(() => {
    const controller = new AbortController()

    apiRequest(`/api/v1/analytics/daily/${date}`, { signal: controller.signal })
      .then((analyticsData) => {
        setData(analyticsData)
        setError('')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Failed to load breakdown chart')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [date, refreshTrigger])

  const hasData = data.some((item) => Number(item.total_seconds) > 0)

  return (
    <ChartPanel
      title="Daily breakdown"
      description="Time distribution and points earned per task"
      isLoading={loading}
      error={error}
      isEmpty={!loading && !error && !hasData}
      emptyTitle="No sessions yet"
      emptyDescription="Start and complete a task timer to visualize your breakdown."
    >
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={data.filter((item) => Number(item.total_seconds) > 0)}
            dataKey="total_seconds"
            nameKey="task_name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={3}
          >
            {data
              .filter((item) => Number(item.total_seconds) > 0)
              .map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
              ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
            formatter={(value, entry) => {
              const itemPayload = entry.payload?.payload
              if (!itemPayload) return value
              const totalHours = (itemPayload.total_seconds / 3600).toFixed(2)
              return `${value}: ${totalHours}h, ${itemPayload.points} pts`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  )
}
