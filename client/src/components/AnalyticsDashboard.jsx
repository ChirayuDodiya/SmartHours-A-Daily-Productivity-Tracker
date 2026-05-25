import { useState, useEffect } from 'react'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import SharedBarChart from './SharedBarChart'
import ChartPanel from './shared/ChartPanel'
import OptimizedPieChart from './charts/OptimizedPieChart'
import { apiRequest } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      <div className="page-stack">
        <PageHeader
          eyebrow="Reports"
          title="Analytics"
          description="Review productivity trends across weeks, months, and custom ranges."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-2 grid h-auto w-full grid-cols-2 gap-1 sm:inline-flex sm:w-auto sm:grid-cols-none">
            {['weekly', 'monthly', 'yearly', 'custom'].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="custom" className="mt-0">
            <Card className="shadow-card">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-4 sm:p-6">
                <div className="form-field">
                  <Label htmlFor="from-date">From date</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={customRange.from}
                    onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="to-date">To date</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={customRange.to}
                    onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                  />
                </div>
                <Button type="button" className="w-full sm:w-auto" onClick={handleGenerateCustom}>
                  Generate
                </Button>
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
          className="mt-0"
          emptyDescription={
            activeTab === 'custom'
              ? 'Select a date range and click generate.'
              : 'Complete tasks to see your progress here.'
          }
        >
          {activeTab === 'custom' ? (
            <OptimizedPieChart data={data} variant="analytics" />
          ) : (
            <SharedBarChart data={data} isLoading={isLoading} activeTab={activeTab} />
          )}
        </ChartPanel>
      </div>
    </ProtectedShell>
  )
}
