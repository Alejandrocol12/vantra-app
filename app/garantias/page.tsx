'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Check, Trash2, ShieldAlert, Clock, ShieldCheck, ShieldX } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface Cliente { id: string; name: string }
interface Garantia {
  id: string; productName: string; variantLabel: string | null
  clienteId: string | null; cliente: { name: string } | null
  issue: string; status: string; resolution: string | null
  date: string; resolvedAt: string | null
}

const STATUS_STYLES: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  pendiente:  { label: 'Pendiente',  class: 'badge-warn',    icon: Clock },
  resuelto:   { label: 'Resuelto',   class: 'badge-success', icon: ShieldCheck },
  rechazado:  { label: 'Rechazado',  class: 'badge-danger',  icon: ShieldX },
}

const emptyForm = { productName: '', variantLabel: '', clienteId: '', issue: '' }

export default function GarantiasPage() {
  const { messages, toast, dismiss } = useToast()
  const [items, setItems] = useState<Garantia[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  async function load() {
    const [g, c] = await Promise.all([fetch('/api/garantias').then(r => r.json()), fetch('/api/clientes').then(r => r.json())])
    setItems(g); setClientes(c)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/garantias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast('Garantía registrada.'); setForm({ ...emptyForm }); setShowForm(false); load()
    } finally { setSaving(false) }
  }

  async function resolve(id: string, status: string) {
    const res = await fetch(`/api/garantias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution }),
    })
    if (!res.ok) { toast('Error al actualizar.', 'error'); return }
    toast(status === 'resuelto' ? 'Marcado como resuelto.' : 'Marcado como rechazado.')
    setResolving(null); setResolution(''); load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/garantias/${id}`, { method: 'DELETE' })
    toast('Garantía eliminada.'); load()
  }

  const filtered = statusFilter === 'todos' ? items : items.filter(g => g.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Posventa</p>
          <h1>Garantías</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={13} /> Nueva garantía
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-semibold">Registrar reclamación</p>
            <button type="button" onClick={() => setShowForm(false)} className="btn-icon"><X size={13} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Producto *</label>
              <input className="input text-[12px]" required placeholder="Ej. Elf Bar BC5000" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Sabor / variante</label>
              <input className="input text-[12px]" placeholder="Ej. Mango Ice" value={form.variantLabel} onChange={e => setForm(f => ({ ...f, variantLabel: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Cliente</label>
              <select className="input text-[12px]" value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}>
                <option value="">— Sin cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label className="label">Problema reportado *</label>
              <textarea className="input text-[12px] resize-none" rows={2} required placeholder="Describe el defecto o problema…" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['todos', 'pendiente', 'resuelto', 'rechazado'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('btn text-[11px] py-1 px-3', statusFilter === s && 'bg-accent/20 border-accent/40 text-ink')}>
            {s === 'todos' ? 'Todos' : STATUS_STYLES[s].label}
            <span className="ml-1 text-muted">({s === 'todos' ? items.length : items.filter(g => g.status === s).length})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card divide-y divide-white/[0.05]">
        {filtered.length === 0
          ? <p className="empty-state py-10">No hay garantías {statusFilter !== 'todos' ? `con estado "${STATUS_STYLES[statusFilter]?.label}"` : 'registradas'}.</p>
          : filtered.map(g => {
            const S = STATUS_STYLES[g.status] ?? STATUS_STYLES.pendiente
            const Icon = S.icon
            return (
              <div key={g.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className={g.status === 'resuelto' ? 'text-success' : g.status === 'rechazado' ? 'text-danger' : 'text-warn'} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug">
                        {g.productName}{g.variantLabel ? ` · ${g.variantLabel}` : ''}
                      </p>
                      {g.cliente && <p className="text-[11px] text-muted">Cliente: {g.cliente.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('badge', S.class)}>{S.label}</span>
                    <button onClick={() => handleDelete(g.id)} className="btn-icon hover:!text-danger"><Trash2 size={12} /></button>
                  </div>
                </div>

                <p className="text-[12px] text-muted bg-surface2 rounded-lg px-3 py-2">
                  <span className="text-ink font-medium">Problema: </span>{g.issue}
                </p>

                {g.resolution && (
                  <p className="text-[12px] text-muted bg-success/5 border border-success/15 rounded-lg px-3 py-2">
                    <span className="text-success font-medium">Resolución: </span>{g.resolution}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[11px] text-muted">{formatDate(g.date)}</p>
                  {g.status === 'pendiente' && (
                    resolving === g.id
                      ? (
                        <div className="flex items-center gap-2 w-full mt-1">
                          <input
                            className="input text-[12px] flex-1"
                            placeholder="Descripción de la resolución (opcional)"
                            value={resolution}
                            onChange={e => setResolution(e.target.value)}
                          />
                          <button onClick={() => resolve(g.id, 'resuelto')} className="btn-primary py-1 px-3 text-[11px]">
                            <Check size={12} /> Resuelto
                          </button>
                          <button onClick={() => resolve(g.id, 'rechazado')} className="btn text-[11px] py-1 px-3 hover:!text-danger">
                            <ShieldX size={12} /> Rechazar
                          </button>
                          <button onClick={() => { setResolving(null); setResolution('') }} className="btn-icon"><X size={12} /></button>
                        </div>
                      )
                      : (
                        <button onClick={() => setResolving(g.id)} className="btn text-[11px] py-1">
                          <ShieldAlert size={12} /> Resolver
                        </button>
                      )
                  )}
                </div>
              </div>
            )
          })
        }
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
