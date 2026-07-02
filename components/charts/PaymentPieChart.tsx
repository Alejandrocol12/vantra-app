'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#0f766e', '#eab308', '#3b82f6', '#f97316', '#8b5cf6']

interface DataPoint {
  method: string
  total: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted mb-1">{payload[0].name}</p>
      <p className="font-bold text-ink">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function PaymentPieChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted text-sm">
        Sin datos para el período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="method"
          cx="50%"
          cy="50%"
          outerRadius={75}
          innerRadius={40}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#647386' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
