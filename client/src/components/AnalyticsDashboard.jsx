import { useState, useEffect } from 'react'
import ProtectedShell from './ProtectedShell'
import { apiRequest } from '../utils/helpers'
import SharedBarChart from './SharedBarChart'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f43f5e', '#3b82f6', '#14b8a6', '#eab308'
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

  const hasData = data && data.length > 0 && (activeTab !== 'custom' || data.some((item) => Number(item.total_seconds) > 0))

  return (
    <ProtectedShell user={user} onLogout={onLogout}>
      <section className="calendar-shell" aria-labelledby="analytics-title">
        <div className="calendar-heading">
          <div>
            <p className="eyebrow">Reports</p>
            <h1 id="analytics-title">Analytics</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['weekly', 'monthly', 'yearly', 'custom'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'primary-action' : 'secondary-action'}
              style={{ padding: '0 20px', minHeight: '40px', width: 'auto', textTransform: 'capitalize', marginTop: 0 }}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'custom') {
                  setData([])
                  setIsLoading(false)
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'custom' && (
          <div className="pack-picker" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: '150px' }}>
              From Date
              <input 
                type="date" 
                value={customRange.from} 
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })} 
                required 
              />
            </label>
            <label style={{ flex: 1, minWidth: '150px' }}>
              To Date
              <input 
                type="date" 
                value={customRange.to} 
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })} 
                required 
              />
            </label>
            <button type="button" className="primary-action" style={{ padding: '0 24px', height: '42px', marginTop: 0 }} onClick={handleGenerateCustom}>
              Generate
            </button>
          </div>
        )}

        {error && (
          <p className="form-status error" style={{ marginBottom: '20px' }}>
            {error}
          </p>
        )}

        <div className="analytics-panel">
          <div className="analytics-header">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Overview</h2>
            <p className="analytics-subtitle">
              {activeTab === 'custom' ? 'Time distribution by task label' : 'Total points earned over time'}
            </p>
          </div>

          <div className="chart-container">
            {isLoading ? (
              <p className="chart-status">Loading chart data...</p>
            ) : !hasData ? (
              <div className="chart-empty">
                <p>No data available</p>
                <span>{activeTab === 'custom' ? 'Select a date range and click generate.' : 'Complete tasks to see your progress here.'}</span>
              </div>
            ) : activeTab === 'custom' ? (
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
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)' }}
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
          </div>
        </div>
      </section>
    </ProtectedShell>
  )
}
