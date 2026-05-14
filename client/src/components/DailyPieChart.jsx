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

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#eab308', // Yellow
]

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{data.task_name}</p>
        <div className="tooltip-metrics">
          <p>
            <span>Time:</span> <strong>{formatDuration(data.total_seconds)}</strong>
          </p>
          <p>
            <span>Share:</span> <strong>{data.pct}%</strong>
          </p>
          <p>
            <span>Points:</span> <strong>{data.points}</strong>
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
        if (err.name === 'AbortError') {
          return
        }
        setError('Failed to load breakdown chart')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [date, refreshTrigger])

  const hasData = data.some((item) => Number(item.total_seconds) > 0)

  return (
    <section className="analytics-panel" aria-labelledby="analytics-title">
      <div className="analytics-header">
        <h2 id="analytics-title">Daily Breakdown</h2>
        <p className="analytics-subtitle">Time distribution and points earned per task</p>
      </div>

      <div className="chart-container">
        {loading && <div className="chart-status">Loading chart data...</div>}
        {!loading && error && <div className="chart-status error">{error}</div>}
        {!loading && !error && !hasData && (
          <div className="chart-empty">
            <p>No sessions yet for that day</p>
            <span>Start and complete a task timer to visualize your breakdown.</span>
          </div>
        )}
        {!loading && !error && hasData && (
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
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth={2}
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
                  if (!itemPayload) {
                    return <span className="legend-label">{value}</span>
                  }
                  const totalHours = (itemPayload.total_seconds / 3600).toFixed(2)
                  return (
                    <span className="legend-label">
                      <strong>{value}</strong>: {totalHours}h, {itemPayload.points} pts, {itemPayload.pct}%
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

