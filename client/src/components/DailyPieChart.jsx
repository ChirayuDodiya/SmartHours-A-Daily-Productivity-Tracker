import { memo, useEffect, useState } from 'react'
import { apiRequest } from '../utils/helpers'
import ChartPanel from './shared/ChartPanel'
import OptimizedPieChart from './charts/OptimizedPieChart'

function DailyPieChart({ date, refreshTrigger }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        if (!controller.signal.aborted) {
          setLoading(false)
        }
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
      className="mt-0"
    >
      <OptimizedPieChart data={data} variant="daily" />
    </ChartPanel>
  )
}

export default memo(DailyPieChart)
