import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  TrendingUp,
  Trophy,
  Zap,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react'
import ProtectedShell from './ProtectedShell'
import SharedBarChart from './SharedBarChart'
import OptimizedPieChart from './charts/OptimizedPieChart'
import EmptyState from './shared/EmptyState'
import { apiRequest, formatDuration, getDateKey } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom Range' },
]

export default function AnalyticsDashboard({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
}) {
  const [activeTab, setActiveTab] = useState('weekly')
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [customRange, setCustomRange] = useState({ from: '', to: '' })

  useEffect(() => {
    if (activeTab !== 'custom') {
      loadData(activeTab)
    }
  }, [activeTab])

  async function loadData(tab, from, to) {
    try {
      setIsLoading(true)
      setError('')
      let url = `/api/v1/analytics/${tab}`
      if (tab === 'custom' && from && to) {
        url = `/api/v1/analytics/range?from=${from}&to=${to}`
      }
      const response = await apiRequest(url)
      setData(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleGenerateCustom() {
    if (!customRange.from || !customRange.to) {
      setError('Please select both from and to dates')
      return
    }
    loadData('custom', customRange.from, customRange.to)
  }

  function handleQuickRange(daysBack) {
    const today = new Date()
    const fromDate = new Date()
    fromDate.setDate(today.getDate() - daysBack)
    const from = getDateKey(fromDate)
    const to = getDateKey(today)
    setCustomRange({ from, to })
    loadData('custom', from, to)
  }

  function handleTabChange(value) {
    setActiveTab(value)
    if (value === 'custom') {
      setData([])
      setIsLoading(false)
    }
  }

  // Summary Metrics Calculation
  const { totalPoints, totalTimeSeconds, avgPoints, bestDay } = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { totalPoints: 0, totalTimeSeconds: 0, avgPoints: 0, bestDay: null }
    }

    if (activeTab === 'custom') {
      // Data is breakdown per task: { task_name, total_seconds, points, pct }
      let pts = 0
      let secs = 0
      data.forEach((item) => {
        pts += Number(item.points) || 0
        secs += Number(item.total_seconds) || 0
      })
      return {
        totalPoints: pts,
        totalTimeSeconds: secs,
        avgPoints: pts / Math.max(1, data.length),
        bestDay: null,
      }
    }

    // Data is scores over days: { date/month, total_points, total_seconds }
    let pts = 0
    let secs = 0
    let maxPts = 0
    let best = null

    data.forEach((item) => {
      const p = Number(item.total_points) || 0
      const s = Number(item.total_seconds) || 0
      pts += p
      secs += s
      if (p > maxPts) {
        maxPts = p
        best = { date: item.date || item.month, points: p }
      }
    })

    return {
      totalPoints: pts,
      totalTimeSeconds: secs,
      avgPoints: pts / Math.max(1, data.length),
      bestDay: best,
    }
  }, [data, activeTab])

  const hasData =
    data &&
    data.length > 0 &&
    (activeTab !== 'custom' || data.some((item) => Number(item.total_seconds) > 0))

  const chartMeta = useMemo(() => {
    switch (activeTab) {
      case 'weekly':
        return {
          title: 'Weekly Momentum',
          subtitle: 'Daily focus accumulation against target baseline',
          badge: '40 pts target',
        }
      case 'monthly':
        return {
          title: 'Monthly Consistency',
          subtitle: 'Daily performance trajectory across the month',
          badge: '40 pts target',
        }
      case 'yearly':
        return {
          title: 'Yearly Aggregate Arc',
          subtitle: 'Monthly output volume and seasonal rhythm',
          badge: `${data?.length || 0} months tracked`,
        }
      case 'custom':
        return {
          title: 'Custom Task Allocation',
          subtitle: 'Time distribution breakdown across selected date range',
          badge: `${data?.length || 0} tasks tracked`,
        }
      default:
        return { title: 'Productivity Curve', subtitle: '', badge: '' }
    }
  }, [activeTab, data])

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[560px] max-w-full gap-2.5 overflow-hidden">
        {/* Compact Command Bar: View Switcher + High-Density Telemetry Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/70 pb-2.5 shrink-0">
          {/* Left: View Switcher Pills */}
          <div className="flex items-center rounded-xl border border-border/80 bg-card p-0.5 shadow-xs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Right: Inline High-Density Telemetry Badges */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-xs shrink-0">
              <Zap className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">
                {totalPoints.toFixed(1)} pts
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-xs shrink-0">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Focus:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">
                {formatDuration(totalTimeSeconds)}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-xs shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">
                {avgPoints.toFixed(1)} pts
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-xs shrink-0">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">Peak:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">
                {bestDay
                  ? `${bestDay.points.toFixed(1)} pts (${bestDay.date.slice(5)})`
                  : `${totalPoints.toFixed(1)} pts`}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Custom Range Filter Bar (Only when Custom tab is selected) */}
        {activeTab === 'custom' && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 shadow-xs shrink-0">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Presets:
              </span>
              {[
                { label: '7d', days: 7 },
                { label: '14d', days: 14 },
                { label: '30d', days: 30 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handleQuickRange(p.days)}
                  className="h-6 px-2 text-[11px] font-semibold rounded-md border border-border/70 bg-background/80 hover:bg-muted text-foreground transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date Pickers + Action */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  From:
                </span>
                <Input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                  className="h-7 w-32 sm:w-34 px-2 text-xs rounded-lg border-border/80 bg-background dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  To:
                </span>
                <Input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                  className="h-7 w-32 sm:w-34 px-2 text-xs rounded-lg border-border/80 bg-background dark:[color-scheme:dark]"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateCustom}
                className="h-7 px-3 text-xs font-bold rounded-lg shadow-xs"
              >
                Analyze
              </Button>
            </div>
          </div>
        )}

        {/* Inline Error Notice */}
        {error && (
          <Alert variant="destructive" className="py-2 px-3 text-xs shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Telemetry Canvas: Fits remaining viewport space without scrolling */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          {/* Canvas Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                {chartMeta.title}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {chartMeta.subtitle}
              </p>
            </div>

            {/* Target indicator or period badge */}
            {(activeTab === 'weekly' || activeTab === 'monthly') && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Target: 40 pts
              </span>
            )}

            {(activeTab === 'yearly' || (activeTab === 'custom' && hasData)) && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full border border-border/60 shrink-0">
                {chartMeta.badge}
              </span>
            )}
          </div>

          {/* Chart Viewport: Dynamically expands to 100% of available height */}
          <div className="flex-1 min-h-0 w-full relative pt-2">
            {isLoading && (
              <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            )}

            {!isLoading && error && (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              </div>
            )}

            {!isLoading && !error && !hasData && (
              <div className="h-full w-full flex items-center justify-center">
                <EmptyState
                  icon={activeTab === 'custom' ? Calendar : BarChart3}
                  title={activeTab === 'custom' ? 'No custom data selected' : 'No activity recorded'}
                  description={
                    activeTab === 'custom'
                      ? 'Pick a date range above or use a quick preset (7d, 14d, 30d) and click Analyze.'
                      : 'Complete focus sessions in the Calendar tab to start generating productivity curves.'
                  }
                  className="border-none bg-transparent py-4 max-w-md"
                  action={
                    activeTab === 'custom' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickRange(7)}
                        className="text-xs font-semibold"
                      >
                        Load Last 7 Days
                      </Button>
                    ) : null
                  }
                />
              </div>
            )}

            {!isLoading && !error && hasData && (
              activeTab === 'custom' ? (
                <OptimizedPieChart
                  data={data}
                  variant="analytics"
                  height="100%"
                  className="h-full w-full"
                />
              ) : (
                <SharedBarChart
                  data={data}
                  isLoading={isLoading}
                  activeTab={activeTab}
                  height="100%"
                  className="h-full w-full"
                />
              )
            )}
          </div>
        </div>
      </div>
    </ProtectedShell>
  )
}
