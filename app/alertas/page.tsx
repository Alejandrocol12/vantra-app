'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import StockBar, { stockStatus } from '@/components/StockBar'

interface Variant { id: string; label: string; stock: number; minStock: number }
interface Product { id: string; name: string; category: string; flavor: string | null; stock: number; minStock: number; price: number; hasVariants: boolean; variants: Variant[] }

interface AlertRow {
  key: string; productName: string; label: string | null; category: string
  stock: number; minStock: number; hasVariants: boolean
}

export default function AlertasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Build flat alert list covering both regular products and variants
  const alertRows: AlertRow[] = []
  for (const p of products) {
    if (p.hasVariants) {
      for (const v of p.variants) {
        const s = stockStatus(v.stock, v.minStock)
        if (s !== 'ok') alertRows.push({ key: `${p.id}-${v.id}`, productName: p.name, label: v.label, category: p.category, stock: v.stock, minStock: v.minStock, hasVariants: true })
      }
    } else {
      const s = stockStatus(p.stock, p.minStock)
      if (s !== 'ok') alertRows.push({ key: p.id, productName: p.name, label: p.flavor, category: p.category, stock: p.stock, minStock: p.minStock, hasVariants: false })
    }
  }

  const critical = alertRows.filter(r => { const s = stockStatus(r.stock, r.minStock); return s === 'crit' || s === 'out' })
  const warnings = alertRows.filter(r => stockStatus(r.stock, r.minStock) === 'low')

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Reportes</p>
          <h1>Alertas de inventario</h1>
        </div>
        <button className="btn" onClick={load}><RefreshCw size={13} />Actualizar</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="metric">
          <p className="metric-label">Alertas activas</p>
          <p className="metric-value">{alertRows.length}</p>
          <p className="metric-sub">en total</p>
        </div>
        <div className="metric">
          <p className="metric-label">Críticas / agotadas</p>
          <p className={cn('metric-value', critical.length > 0 ? 'text-danger' : '')}>{critical.length}</p>
          <p className={critical.length > 0 ? 'metric-sub-alert' : 'metric-sub'}>{critical.length > 0 ? 'requieren pedido urgente' : 'Sin críticas'}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Advertencias</p>
          <p className={cn('metric-value', warnings.length > 0 ? 'text-warn' : '')}>{warnings.length}</p>
          <p className={warnings.length > 0 ? 'metric-sub text-warn' : 'metric-sub'}>{warnings.length > 0 ? 'stock bajo pero disponible' : 'Sin advertencias'}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Alertas activas</span>
          {alertRows.length > 0 && <span className="badge badge-danger">{critical.length} críticas · {warnings.length} advertencias</span>}
        </div>
        <div className="overflow-x-auto">
          {loading ? <p className="empty-state">Cargando…</p>
            : alertRows.length === 0 ? <p className="empty-state">✓ Todo el inventario está por encima del stock mínimo.</p>
            : (
              <table className="tbl">
                <thead>
                  <tr>{['Severidad', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Nivel', 'Motivo'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[...critical, ...warnings].map(r => {
                    const s = stockStatus(r.stock, r.minStock)
                    const isCrit = s === 'crit' || s === 'out'
                    return (
                      <tr key={r.key}>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {isCrit ? <AlertTriangle size={13} className="text-danger" /> : <AlertCircle size={13} className="text-warn" />}
                            <span className={cn('badge', isCrit ? 'badge-danger' : 'badge-warn')}>{isCrit ? 'Crítico' : 'Advertencia'}</span>
                          </div>
                        </td>
                        <td>
                          <p className="font-medium">{r.productName}</p>
                          {r.label && (
                            <p className={cn('text-[11px] flex items-center gap-1', r.hasVariants ? 'text-brand' : 'text-muted')}>
                              {r.hasVariants && <Layers size={10} />}{r.label}
                            </p>
                          )}
                        </td>
                        <td className="text-muted">{r.category}</td>
                        <td className={cn('font-semibold', r.stock === 0 ? 'text-danger' : isCrit ? 'text-danger' : 'text-warn')}>{r.stock}</td>
                        <td className="text-muted">{r.minStock}</td>
                        <td><StockBar stock={r.stock} minStock={r.minStock} /></td>
                        <td className="text-[12px] text-muted">{r.stock === 0 ? 'Agotado' : `${r.stock} uds — mínimo: ${r.minStock}`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  )
}
