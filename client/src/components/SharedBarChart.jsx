import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function SharedBarChart({ data, isLoading, activeTab }) {
  function formatXAxis(tickItem) {
    if (activeTab === 'weekly' || activeTab === 'monthly') {
      if (!tickItem) return ''
      const parts = tickItem.split('-')
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}` // MM/DD
      }
    }
    if (activeTab === 'yearly' && tickItem) {
      const parts = tickItem.split('-')
      if (parts.length === 2) {
        const date = new Date(parts[0], parseInt(parts[1]) - 1)
        return date.toLocaleString('default', { month: 'short' })
      }
    }
    return tickItem
  }

  if (isLoading) {
    return <div className="chart-status">Loading chart data...</div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data available</p>
        <span>Complete tasks to see your progress here.</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis 
          dataKey={activeTab === 'yearly' ? 'month' : 'date'} 
          tickFormatter={formatXAxis} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: 'var(--text)', fontSize: 13 }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: 'var(--text)', fontSize: 13 }} 
        />
        <Tooltip 
          cursor={{ fill: 'rgba(22, 105, 122, 0.05)' }}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)' }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Bar dataKey="total_points" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Points" />
      </BarChart>
    </ResponsiveContainer>
  )
}
