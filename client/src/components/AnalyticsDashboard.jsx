import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import SharedBarChart from './SharedBarChart'
import ChartPanel from './shared/ChartPanel'
import StatCard from './shared/StatCard'
import OptimizedPieChart from './charts/OptimizedPieChart'
import { apiRequest, formatDuration, getDateKey } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

  const chartTitle = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Performance`
  const chartDescription =
    activeTab === 'custom'
      ? 'Time & percentage distribution by task label across the selected window'
      : 'Points momentum and focus output recorded over time'

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      <div className="page-stack">
        <PageHeader
          eyebrow="Intelligence & Metrics"
          title="Productivity Analytics"
          description="Analyze your deep work patterns, point accumulation rates, and consistency over time."
        />

        {/* Aggregate KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Points"
            value={`${totalPoints.toFixed(1)} pts`}
            subvalue={`Across ${data?.length || 0} periods`}
            icon={Zap}
          />
          <StatCard
            label="Total Focus"
            value={formatDuration(totalTimeSeconds)}
            subvalue="Cumulative session duration"
            icon={Clock}
          />
          <StatCard
            label="Average Output"
            value={`${avgPoints.toFixed(1)} pts`}
            subvalue="Per tracked interval"
            icon={TrendingUp}
          />
          <StatCard
            label="Top Performance"
            value={bestDay ? `${bestDay.points.toFixed(1)} pts` : `${totalPoints.toFixed(1)} pts`}
            subvalue={bestDay ? `Peak day (${bestDay.date})` : 'Highest session output'}
            icon={Trophy}
          />
        </div>

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-2 grid h-auto w-full grid-cols-2 gap-1 sm:inline-flex sm:w-auto sm:grid-cols-none bg-card border border-border/80 p-1 rounded-xl">
            {['weekly', 'monthly', 'yearly', 'custom'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="custom" className="mt-4">
            <Card className="shadow-card border-border/80">
              <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">
                    Quick Presets:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => handleQuickRange(7)}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => handleQuickRange(14)}
                  >
                    Last 14 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => handleQuickRange(30)}
                  >
                    Last 30 Days
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-4 border-t border-border/60 pt-4">
                  <div className="form-field">
                    <Label htmlFor="from-date" className="text-xs font-semibold">
                      From date
                    </Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={customRange.from}
                      onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="to-date" className="text-xs font-semibold">
                      To date
                    </Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={customRange.to}
                      onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-10 rounded-xl font-bold shadow-sm"
                    onClick={handleGenerateCustom}
                  >
                    Analyze Range
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ChartPanel
          title={chartTitle}
          description={chartDescription}
          isLoading={isLoading && activeTab !== 'custom'}
          error={!isLoading ? error : ''}
          isEmpty={!isLoading && !error && !hasData}
          className="mt-0 rounded-2xl border-border/80 shadow-card"
          emptyDescription={
            activeTab === 'custom'
              ? 'Select a date range above and click analyze to see your task distribution.'
              : 'Complete focus sessions to start generating historical productivity curves.'
          }
        >
          {activeTab === 'custom' ? (
            <OptimizedPieChart data={data} variant="analytics" height={340} />
          ) : (
            <SharedBarChart data={data} isLoading={isLoading} activeTab={activeTab} />
          )}
        </ChartPanel>
      </div>
    </ProtectedShell>
  )
}
