import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function SharedBarChart({ data, isLoading, activeTab }) {
  function formatXAxis(tickItem) {
    if (activeTab === 'weekly' || activeTab === 'monthly') {
      if (!tickItem) return ''
      const parts = tickItem.split('-')
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`
      }
    }
    if (activeTab === 'yearly' && tickItem) {
      const parts = tickItem.split('-')
      if (parts.length === 2) {
        const date = new Date(parts[0], parseInt(parts[1], 10) - 1)
        return date.toLocaleString('default', { month: 'short' })
      }
    }
    return tickItem
  }

  if (isLoading) {
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey={activeTab === 'yearly' ? 'month' : 'date'}
          tickFormatter={formatXAxis}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13 }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
          contentStyle={{
            borderRadius: '0.5rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Bar
          dataKey="total_points"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="Points"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
