import { memo, useEffect, useState } from 'react'
import { apiRequest } from '../utils/helpers'
import OptimizedPieChart from './charts/OptimizedPieChart'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart as PieChartIcon } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[260px] rounded-2xl border border-border/70 bg-card">
        <Skeleton className="h-40 w-40 rounded-full" />
        <Skeleton className="mt-4 h-3 w-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[260px] rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive text-sm text-center">
        <p>{error}</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[260px] rounded-2xl border border-dashed border-border/80 bg-muted/20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
          <PieChartIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No focus time logged yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Start a task timer above to see your time breakdown and share percentages.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Focus Breakdown
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Hover slices for % share</span>
      </div>

      <div className="pt-2">
        <OptimizedPieChart data={data} variant="daily" height={250} />
      </div>
    </div>
  )
}

export default memo(DailyPieChart)
