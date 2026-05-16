import { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import SharedBarChart from './SharedBarChart'
import ChartPanel from './shared/ChartPanel'
import { apiRequest } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function AnalyticsDashboard({ user, onLogout }) {
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

  function handleTabChange(value) {
    setActiveTab(value)
    if (value === 'custom') {
      setData([])
      setIsLoading(false)
    }
  }

  const hasData =
    data &&
    data.length > 0 &&
    (activeTab !== 'custom' || data.some((item) => Number(item.total_seconds) > 0))

  const chartTitle = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} overview`
  const chartDescription =
    activeTab === 'custom'
      ? 'Time distribution by task label'
      : 'Total points earned over time'

  return (
    <ProtectedShell user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Reports"
        title="Analytics"
        description="Review productivity trends across weeks, months, and custom ranges."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
          {['weekly', 'monthly', 'yearly', 'custom'].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="custom">
          <Card className="mb-6">
            <CardContent className="flex flex-wrap items-end gap-4 p-6">
              <div className="min-w-[150px] flex-1 space-y-2">
                <Label htmlFor="from-date">From date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                />
              </div>
              <div className="min-w-[150px] flex-1 space-y-2">
                <Label htmlFor="to-date">To date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                />
              </div>
              <Button type="button" onClick={handleGenerateCustom}>
                Generate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ChartPanel
        title={chartTitle}
        description={chartDescription}
        isLoading={isLoading && activeTab !== 'custom'}
        error={!isLoading ? error : ''}
        isEmpty={!isLoading && !error && !hasData}
        emptyDescription={
          activeTab === 'custom'
            ? 'Select a date range and click generate.'
            : 'Complete tasks to see your progress here.'
        }
      >
        {activeTab === 'custom' ? (
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
              <Tooltip
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
                formatter={(value, name, props) => {
                  const pts = props.payload.points
                  return [`${(value / 3600).toFixed(2)}h (${pts} pts)`, name]
                }}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <SharedBarChart data={data} isLoading={isLoading} activeTab={activeTab} />
        )}
      </ChartPanel>
    </ProtectedShell>
  )
}
