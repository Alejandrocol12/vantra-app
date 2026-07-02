'use client'

import { useEffect, useState } from 'react'
import { Ban, RefreshCw, Edit2, Check, X, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, PAYMENT_METHODS } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Sale {
  id: string
  productName: string
  variantLabel: string | null
  quantity: number
  payment: string
  note: string | null
  total: number
  profit: number
  status: string
  date: string
}

export default function VentasPage() {
  const { messages, toast, dismiss } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState('all')
  const [showAnuladas, setShowAnuladas] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPayment, setEditPayment] = useState('')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/sales')
    setSales(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAnular(id: string) {
    const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error, 'error'); return }
    const data = await res.json()
    toast(data.deleted ? 'Venta eliminada.' : 'Venta anulada y stock restaurado.')
    load()
  }

  function startEdit(s: Sale) {
    setEditingId(s.id)
    setEditPayment(s.payment)
    setEditNote(s.note ?? '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment: editPayment, note: editNote }),
      })
      if (!res.ok) { toast((await res.json()).error, 'error'); return }
      toast('Venta actualizada.')
      setEditingId(null)
      load()
    } finally { setSaving(false) }
  }

  const now = new Date()
  const periodFiltered = sales.filter(s => {
    const d = new Date(s.date)
    if (periodFilter === 'today') return d.toDateString() === now.toDateString()
    if (periodFilter === 'week') return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7
    return true
  })

  const visible = showAnuladas ? periodFiltered : periodFiltered.filter(s => s.status !== 'anulada')
  const activas = periodFiltered.filter(s => s.status !== 'anulada')
  const anuladas = periodFiltered.filter(s => s.status === 'anulada')

  const totalRevenue = activas.reduce((s, v) => s + v.total, 0)
  const totalProfit  = activas.reduce((s, v) => s + v.profit, 0)
  const totalUnits   = activas.reduce((s, v) => s + v.quantity, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Reportes</p>
          <h1>Historial de ventas</h1>
        </div>
        <Link href="/pos" className="btn-primary">Nueva venta →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="metric">
          <p className="metric-label">Total ingresos</p>
          <p className="metric-value">{formatCurrency(totalRevenue)}</p>
          <p className="metric-sub">{activas.length} transacciones</p>
        </div>
        <div className="metric">
          <p className="metric-label">Ganancia estimada</p>
          <p className="metric-value">{formatCurrency(totalProfit)}</p>
          <p className="metric-sub-up">
            {totalRevenue > 0 ? `${Math.round((totalProfit / totalRevenue) * 100)}% margen` : '—'}
          </p>
        </div>
        <div className="metric">
          <p className="metric-label">Unidades vendidas</p>
          <p className="metric-value">{totalUnits}</p>
          <p className="metric-sub">
            {anuladas.length > 0 ? <span className="text-danger">{anuladas.length} anuladas</span> : 'sin anulaciones'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Historial de ventas</span>
          <div className="flex gap-2 items-center flex-wrap">
            <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer select-none">
              <input type="checkbox" checked={showAnuladas} onChange={e => setShowAnuladas(e.target.checked)} className="accent-brand" />
              Mostrar anuladas
            </label>
            <select className="input text-[12px] w-36" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
            </select>
            <button className="btn" onClick={load}><RefreshCw size={12} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="empty-state">Cargando…</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {['Fecha', 'Producto', 'Cant.', 'Pago', 'Total', 'Ganancia', 'Estado', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No hay ventas en este período.</td></tr>
                ) : (
                  visible.map(s => {
                    const isAnulada = s.status === 'anulada'
                    const isEditing = editingId === s.id
                    return (
                      <tr key={s.id} className={isAnulada ? 'opacity-50' : ''}>
                        <td className="text-muted whitespace-nowrap text-[11px]">{formatDate(s.date)}</td>
                        <td className="font-medium">
                          {s.productName}
                          {s.variantLabel && <span className="text-[10px] text-muted ml-1">· {s.variantLabel}</span>}
                        </td>
                        <td className="text-muted">{s.quantity}</td>
                        <td>
                          {isEditing ? (
                            <select className="input text-[11px] w-28" value={editPayment} onChange={e => setEditPayment(e.target.value)}>
                              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                            </select>
                          ) : (
                            <span className="badge badge-info">{s.payment}</span>
                          )}
                        </td>
                        <td className="font-semibold text-info">{formatCurrency(s.total)}</td>
                        <td className="text-success font-medium">{formatCurrency(s.profit)}</td>
                        <td>
                          <span className={cn('badge', isAnulada ? 'badge-danger' : 'badge-success')}>
                            {isAnulada ? 'Anulada' : 'Activa'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {isAnulada ? (
                              <button className="btn-icon hover:!text-danger hover:!border-danger-bg" title="Eliminar permanentemente" onClick={() => handleAnular(s.id)}>
                                <Trash2 size={11} />
                              </button>
                            ) : isEditing ? (
                              <>
                                <button className="btn-icon !text-success hover:!border-success" onClick={() => saveEdit(s.id)} disabled={saving}><Check size={11} /></button>
                                <button className="btn-icon" onClick={() => setEditingId(null)}><X size={11} /></button>
                              </>
                            ) : (
                              <>
                                <button className="btn-icon" title="Editar" onClick={() => startEdit(s)}><Edit2 size={11} /></button>
                                <button className="btn-icon hover:!text-danger hover:!border-danger-bg" title="Anular venta" onClick={() => handleAnular(s.id)}><Ban size={11} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
