'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DataPoint {
  day: string
  total: number
}

interface SalesBarChartProps {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(10,10,22,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <p style={{ fontSize: 11, color: '#72728a', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee' }}>{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function SalesBarChart({ data }: SalesBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.12)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#72728a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#72728a' }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d946ef" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
        <Bar dataKey="total" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
