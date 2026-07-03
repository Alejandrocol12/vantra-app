'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Receipt, TrendingDown, PieChart } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'

const CATEGORIES = ['Domicilio', 'Empaques', 'Servicios', 'Arriendo', 'Publicidad', 'Transporte', 'Varios']
const CAT_COLORS: Record<string, string> = {
  Domicilio: '#a78bfa', Empaques: '#34d399', Servicios: '#60a5fa',
  Arriendo: '#f87171', Publicidad: '#fbbf24', Transporte: '#fb923c', Varios: '#94a3b8',
}

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'all', label: 'Todo' },
]

interface Gasto { id: string; description: string; category: string; amount: number; date: string; note: string | null }
interface Data { gastos: Gasto[]; total: number; byCategory: Record<string, number> }

const emptyForm = { description: '', category: 'Domicilio', amount: '', date: '', note: '' }

export default function GastosPage() {
  const { messages, toast, dismiss } = useToast()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const d = await fetch(`/api/gastos?period=${period}`).then(r => r.json())
      setData(d)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { toast('Ingresa un monto válido.', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      toast('Gasto registrado.')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
      toast('Gasto eliminado.')
      load()
    } finally { setDeleting(null) }
  }

  const topCat = data ? Object.entries(data.byCategory).sort((a, b) => b[1] - a[1]) : []

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Finanzas</p>
          <h1>Gastos del negocio</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary shrink-0">
          <Plus size={13} /> Registrar gasto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4">
          <p className="text-[13px] font-semibold mb-3">Nuevo gasto</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field sm:col-span-2">
              <label className="label">Descripción *</label>
              <input className="input" placeholder="Ej: Domicilio zona norte" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Categoría *</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Monto *</label>
              <input className="input" type="number" min="1" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Fecha</label>
              <input className="input" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Nota</label>
              <input className="input" placeholder="Opcional" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 sm:col-span-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }} className="btn">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Period filter */}
      <div className="flex gap-1.5 flex-wrap">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors ${period === p.value ? 'btn-primary' : 'btn'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="metric">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={13} className="text-danger" />
              <p className="metric-label">Total gastado</p>
            </div>
            <p className="metric-value text-danger">{formatCurrency(data.total)}</p>
          </div>
          <div className="metric">
            <div className="flex items-center gap-1.5 mb-1">
              <Receipt size={13} className="text-muted" />
              <p className="metric-label">Nº de gastos</p>
            </div>
            <p className="metric-value">{data.gastos.length}</p>
          </div>
          <div className="metric">
            <div className="flex items-center gap-1.5 mb-1">
              <PieChart size={13} className="text-muted" />
              <p className="metric-label">Mayor categoría</p>
            </div>
            <p className="metric-value text-[15px]">{topCat[0]?.[0] ?? '—'}</p>
          </div>
        </div>
      )}

      {/* By category breakdown */}
      {data && topCat.length > 0 && (
        <div className="card p-4">
          <p className="text-[12px] font-semibold mb-3">Por categoría</p>
          <div className="space-y-2">
            {topCat.map(([cat, amount]) => {
              const pct = data.total > 0 ? (amount / data.total) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="font-medium" style={{ color: CAT_COLORS[cat] ?? '#94a3b8' }}>{cat}</span>
                    <span className="text-muted">{formatCurrency(amount)} <span className="text-[10px]">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_COLORS[cat] ?? '#94a3b8' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Registros</span>
          <span className="text-[11px] text-muted">{data?.gastos.length ?? 0} gastos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                {['Fecha', 'Descripción', 'Categoría', 'Monto', 'Nota', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-state">Cargando…</td></tr>
              ) : !data?.gastos.length ? (
                <tr><td colSpan={6} className="empty-state">No hay gastos en este período.</td></tr>
              ) : data.gastos.map(g => (
                <tr key={g.id}>
                  <td className="text-muted text-[11px] whitespace-nowrap">{formatDate(g.date)}</td>
                  <td className="font-medium">{g.description}</td>
                  <td>
                    <span className="badge" style={{ color: CAT_COLORS[g.category] ?? '#94a3b8', background: `${CAT_COLORS[g.category] ?? '#94a3b8'}18`, border: `1px solid ${CAT_COLORS[g.category] ?? '#94a3b8'}30` }}>
                      {g.category}
                    </span>
                  </td>
                  <td className="font-semibold text-danger">{formatCurrency(g.amount)}</td>
                  <td className="text-muted text-[11px]">{g.note ?? '—'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deleting === g.id}
                      className="p-1.5 rounded text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
