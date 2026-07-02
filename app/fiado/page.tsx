'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, ChevronDown, ChevronUp, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface ClienteRow {
  id: string
  name: string
  phone: string | null
  note: string | null
  limiteCredito: number | null
  totalFiado: number
  totalAbonado: number
  deuda: number
  lastSale: string | null
  salesCount: number
}

interface Sale { id: string; productName: string; quantity: number; total: number; date: string; note: string | null }
interface Abono { id: string; amount: number; note: string | null; date: string }

const emptyForm = { name: '', phone: '', note: '', limiteCredito: '' }

export default function FiadoPage() {
  const { messages, toast, dismiss } = useToast()
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [editId, setEditId] = useState<string | null>(null)

  // Abono
  const [abonoClienteId, setAbonoClienteId] = useState<string | null>(null)
  const [abonoAmount, setAbonoAmount] = useState('')
  const [abonoNote, setAbonoNote] = useState('')
  const [savingAbono, setSavingAbono] = useState(false)

  // Detail expansion
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ sales: Sale[]; abonos: Abono[] } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function load() {
    const res = await fetch('/api/clientes')
    setClientes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadDetail(id: string) {
    setLoadingDetail(true)
    const res = await fetch(`/api/clientes/${id}`)
    const data = await res.json()
    setDetail({ sales: data.sales, abonos: data.abonos })
    setLoadingDetail(false)
  }

  function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); setDetail(null) }
    else { setExpandedId(id); loadDetail(id) }
  }

  function startEdit(c: ClienteRow) {
    setEditId(c.id)
    setForm({ name: c.name, phone: c.phone ?? '', note: c.note ?? '', limiteCredito: c.limiteCredito ? String(c.limiteCredito) : '' })
    setAbonoClienteId(null)
  }

  function cancelEdit() { setEditId(null); setForm({ ...emptyForm }) }

  function startAbono(id: string) {
    setAbonoClienteId(id)
    setAbonoAmount('')
    setAbonoNote('')
    setEditId(null)
    setForm({ ...emptyForm })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(editId ? `/api/clientes/${editId}` : '/api/clientes', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast((await res.json()).error, 'error'); return }
      toast(editId ? 'Cliente actualizado.' : 'Cliente registrado.')
      cancelEdit()
      load()
    } finally { setSaving(false) }
  }

  async function handleAbono(e: React.FormEvent) {
    e.preventDefault()
    if (!abonoClienteId) return
    setSavingAbono(true)
    try {
      const res = await fetch(`/api/clientes/${abonoClienteId}/abonos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(abonoAmount), note: abonoNote }),
      })
      if (!res.ok) { toast((await res.json()).error, 'error'); return }
      const cliente = clientes.find(c => c.id === abonoClienteId)
      toast(`Abono de ${formatCurrency(Number(abonoAmount))} registrado para ${cliente?.name}.`)
      setAbonoClienteId(null)
      if (expandedId === abonoClienteId) loadDetail(abonoClienteId)
      load()
    } finally { setSavingAbono(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error, 'error'); return }
    toast('Cliente eliminado.')
    load()
  }

  const totalDeuda = clientes.reduce((s, c) => s + c.deuda, 0)
  const conDeuda   = clientes.filter(c => c.deuda > 0).length
  const sinDeuda   = clientes.filter(c => c.deuda <= 0).length

  const abonoCliente = clientes.find(c => c.id === abonoClienteId)
  const panelTitle = abonoClienteId
    ? `Abonar · ${abonoCliente?.name}`
    : editId ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Clientes</p>
        <h1>Fiado / Créditos</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric">
          <p className="metric-label">Deuda total</p>
          <p className={cn('metric-value', totalDeuda > 0 ? 'text-danger' : 'text-success')}>{formatCurrency(totalDeuda)}</p>
          <p className="metric-sub">{clientes.length} clientes</p>
        </div>
        <div className="metric">
          <p className="metric-label">Con deuda</p>
          <p className="metric-value">{conDeuda}</p>
          <p className="metric-sub">clientes pendientes</p>
        </div>
        <div className="metric">
          <p className="metric-label">Al día</p>
          <p className="metric-value text-success">{sinDeuda}</p>
          <p className="metric-sub">sin deuda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left panel */}
        <div className="space-y-3">
          {/* Client form OR Abono form */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">{panelTitle}</span>
              {(editId || abonoClienteId) && (
                <button onClick={() => { cancelEdit(); setAbonoClienteId(null) }} className="btn-icon">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="p-4">
              {abonoClienteId ? (
                /* Abono form */
                <form onSubmit={handleAbono} className="space-y-3">
                  <div className="p-3 rounded-lg bg-surface2 border border-white/[0.07]">
                    <p className="text-[11px] text-muted mb-0.5">Deuda actual</p>
                    <p className={cn('text-[18px] font-semibold', (abonoCliente?.deuda ?? 0) > 0 ? 'text-danger' : 'text-success')}>
                      {formatCurrency(abonoCliente?.deuda ?? 0)}
                    </p>
                  </div>
                  <div className="field">
                    <label className="label">Monto abono (COP)</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="Ej. 50000"
                      value={abonoAmount}
                      onChange={e => setAbonoAmount(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label">Nota (opcional)</label>
                    <input className="input" placeholder="Método de pago, referencia…" value={abonoNote} onChange={e => setAbonoNote(e.target.value)} />
                  </div>
                  <button type="submit" disabled={savingAbono} className="btn-primary w-full justify-center">
                    <Wallet size={13} />
                    {savingAbono ? 'Registrando…' : 'Registrar abono'}
                  </button>
                </form>
              ) : (
                /* Client form */
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="field">
                    <label className="label">Nombre *</label>
                    <input className="input" required placeholder="Nombre completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="label">Teléfono</label>
                    <input className="input" type="tel" placeholder="300 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="label">Nota</label>
                    <input className="input" placeholder="Referencia, barrio…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="label">Límite de crédito (COP)</label>
                    <input className="input" type="number" min="0" step="1" placeholder="Opcional — sin límite si está vacío" value={form.limiteCredito} onChange={e => setForm(f => ({ ...f, limiteCredito: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                      <Plus size={13} />
                      {saving ? 'Guardando…' : editId ? 'Actualizar' : 'Registrar cliente'}
                    </button>
                    {editId && <button type="button" onClick={cancelEdit} className="btn">Cancelar</button>}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Client table */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Clientes ({clientes.length})</span>
          </div>
          {loading ? (
            <p className="empty-state">Cargando…</p>
          ) : clientes.length === 0 ? (
            <p className="empty-state">Registra tu primer cliente para comenzar.</p>
          ) : (
            <div>
              {clientes.map(c => (
                <div key={c.id}>
                  <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors', expandedId === c.id && 'bg-white/[0.03]')}>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-[13px] font-bold text-brand shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[13px] truncate">{c.name}</p>
                        {c.deuda > 0
                          ? <span className="badge badge-danger">{formatCurrency(c.deuda)}</span>
                          : <span className="badge badge-success">Al día</span>
                        }
                        {c.limiteCredito != null && (
                          <span className="badge badge-warn text-[10px]">límite: {formatCurrency(c.limiteCredito)}</span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        {c.phone && <p className="text-[11px] text-muted">{c.phone}</p>}
                        <p className="text-[11px] text-muted">{c.salesCount} compras a fiado</p>
                        {c.lastSale && <p className="text-[11px] text-subtle hidden sm:block">Última: {formatDate(c.lastSale)}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {c.deuda > 0 && (
                        <button
                          className="btn text-[11px] py-1 px-2.5 text-brand border-brand/30 hover:bg-brand/10"
                          onClick={() => startAbono(c.id)}
                          title="Registrar abono"
                        >
                          <Wallet size={11} /> Abonar
                        </button>
                      )}
                      <button className="btn-icon" title="Ver historial" onClick={() => toggleExpand(c.id)}>
                        {expandedId === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button className="btn-icon" title="Editar" onClick={() => startEdit(c)}>
                        <Pencil size={11} />
                      </button>
                      <button className="btn-icon hover:!text-danger hover:!border-danger/30" title="Eliminar" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === c.id && (
                    <div className="bg-surface2/50 border-b border-white/[0.05] px-4 py-3">
                      {loadingDetail ? (
                        <p className="text-[12px] text-muted py-2">Cargando historial…</p>
                      ) : detail && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sales */}
                          <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Ventas a fiado</p>
                            {detail.sales.length === 0 ? (
                              <p className="text-[12px] text-muted">Sin ventas registradas</p>
                            ) : (
                              <div className="space-y-1.5">
                                {detail.sales.map(s => (
                                  <div key={s.id} className="flex justify-between text-[12px] bg-surface rounded-lg px-3 py-2 border border-white/[0.05]">
                                    <div>
                                      <p className="font-medium">{s.productName} ×{s.quantity}</p>
                                      <p className="text-[11px] text-muted">{formatDate(s.date)}</p>
                                    </div>
                                    <p className="font-semibold text-danger">{formatCurrency(s.total)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Abonos */}
                          <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Abonos registrados</p>
                            {detail.abonos.length === 0 ? (
                              <p className="text-[12px] text-muted">Sin abonos aún</p>
                            ) : (
                              <div className="space-y-1.5">
                                {detail.abonos.map(a => (
                                  <div key={a.id} className="flex justify-between text-[12px] bg-surface rounded-lg px-3 py-2 border border-white/[0.05]">
                                    <div>
                                      <p className="font-medium">{a.note ?? 'Abono'}</p>
                                      <p className="text-[11px] text-muted">{formatDate(a.date)}</p>
                                    </div>
                                    <p className="font-semibold text-success">+{formatCurrency(a.amount)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
