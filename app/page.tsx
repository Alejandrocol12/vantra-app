'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SalesBarChart from '@/components/charts/SalesBarChart'
import StockBar from '@/components/StockBar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardData {
  today: { total: number; units: number; gastos: number }
  month: { total: number; count: number; gastos: number }
  inventory: {
    value: number
    lowStockCount: number
    lowStockProducts: { id: string; name: string; category: string; flavor: string | null; stock: number; minStock: number }[]
  }
  fiado: { totalDeuda: number; clientesConDeuda: number }
  recentSales: { id: string; productName: string; variantLabel?: string | null; quantity: number; payment: string; total: number; date: string }[]
  topProducts: { productId: string; productName: string; units: number; revenue: number; stock: number; minStock: number; category: string }[]
  charts: {
    salesByDay: { day: string; total: number }[]
    paymentMethods: { method: string; total: number }[]
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-muted text-[13px]">Cargando…</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Sistema de inventario y ventas</p>
        <h1>Dashboard</h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric">
          <p className="metric-label">Ventas hoy</p>
          <p className="metric-value">{formatCurrency(data.today.total)}</p>
          <p className="metric-sub">{data.today.units} unidades</p>
        </div>
        <div className="metric">
          <p className="metric-label">Ventas mes</p>
          <p className="metric-value">{formatCurrency(data.month.total)}</p>
          <p className="metric-sub">{data.month.count} transacciones</p>
        </div>
        <div className="metric">
          <p className="metric-label">Stock bajo</p>
          <p className={cn('metric-value', data.inventory.lowStockCount > 0 ? 'text-danger' : '')}>
            {data.inventory.lowStockCount}
          </p>
          <p className={data.inventory.lowStockCount > 0 ? 'metric-sub-alert' : 'metric-sub'}>
            {data.inventory.lowStockCount > 0 ? '↑ requieren atención' : 'Todo OK'}
          </p>
        </div>
        <div className="metric">
          <p className="metric-label">Fiado pendiente</p>
          <p className={cn('metric-value', data.fiado?.totalDeuda > 0 ? 'text-warn' : '')}>
            {formatCurrency(data.fiado?.totalDeuda ?? 0)}
          </p>
          <p className="metric-sub">
            {data.fiado?.clientesConDeuda > 0 ? `${data.fiado.clientesConDeuda} clientes con deuda` : 'Sin deudas pendientes'}
          </p>
        </div>
      </div>

      {/* Gastos del mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="metric">
          <p className="metric-label">Gastos del mes</p>
          <p className="metric-value text-danger">{formatCurrency(data.month.gastos)}</p>
          <p className="metric-sub">hoy: {formatCurrency(data.today.gastos)}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Ganancia real del mes</p>
          <p className={cn('metric-value', (data.month.total - data.month.gastos) >= 0 ? 'text-success' : 'text-danger')}>
            {formatCurrency(Math.max(0, data.month.total - data.month.gastos))}
          </p>
          <p className="metric-sub">ventas − gastos operativos</p>
        </div>
      </div>

      {/* Row 2: Recent sales + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="card">
          <div className="card-head">
            <span className="card-title">Últimas ventas</span>
            <span className="badge badge-info">Hoy</span>
          </div>
          {data.recentSales.length === 0 ? (
            <p className="empty-state">No hay ventas registradas todavía.</p>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.08)]">
              {data.recentSales.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-[10px] gap-3 hover:bg-surface2 transition-colors">
                  <div>
                    <p className="text-[12px] font-medium">{s.productName}{s.variantLabel ? ` · ${s.variantLabel}` : ''}</p>
                    <p className="text-[11px] text-muted">{formatDate(s.date)} · {s.payment}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-info whitespace-nowrap">{formatCurrency(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">Alertas de inventario</span>
            {data.inventory.lowStockCount > 0 && (
              <span className="badge badge-danger">{data.inventory.lowStockCount} críticas</span>
            )}
          </div>
          {data.inventory.lowStockProducts.length === 0 ? (
            <p className="text-[12px] text-muted text-center py-6">✓ Inventario estable</p>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.08)]">
              {data.inventory.lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 px-4 py-[10px]">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0',
                    p.stock === 0 ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn'
                  )}>
                    {p.stock === 0 ? '!' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.stock === 0 ? 'Agotado' : `Solo ${p.stock} uds — mín: ${p.minStock}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-2 border-t border-[rgba(0,0,0,0.08)]">
            <Link href="/alertas" className="text-[11px] text-brand hover:underline">Ver todas las alertas →</Link>
          </div>
        </div>
      </div>

      {/* Row 3: Chart */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Ventas últimos 7 días</span>
        </div>
        <div className="px-3 pt-1 pb-3">
          <SalesBarChart data={data.charts.salesByDay} />
        </div>
      </div>

      {/* Row 4: Top products */}
      {data.topProducts.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Más vendidos esta semana</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  {['Producto', 'Categoría', 'Uds.', 'Ingresos', 'Stock'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map(p => (
                  <tr key={p.productId}>
                    <td className="font-medium">{p.productName}</td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td>{p.units}</td>
                    <td className="font-medium text-info">{formatCurrency(p.revenue)}</td>
                    <td><StockBar stock={p.stock} minStock={p.minStock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
