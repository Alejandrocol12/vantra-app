'use client'

import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface Movement {
  id: string
  reference: string
  productId: string
  productName: string
  variantId: string | null
  variantLabel: string | null
  type: string
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string | null
  date: string
}

interface Variant { id: string; label: string; stock: number }
interface Product { id: string; name: string; category: string; stock: number; hasVariants: boolean; variants: Variant[] }

const typeStyle: Record<string, string> = {
  Venta:   'badge-danger',
  Compra:  'badge-success',
  Ajuste:  'badge-warn',
  Reversa: 'badge-info',
}

export default function MovimientosPage() {
  const { messages, toast, dismiss } = useToast()
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formProductId, setFormProductId] = useState('')
  const [formVariantId, setFormVariantId] = useState('')
  const [formType, setFormType] = useState('Compra')
  const [formQty, setFormQty] = useState(1)
  const [formNote, setFormNote] = useState('')

  async function load() {
    setLoading(true)
    const [mRes, pRes] = await Promise.all([fetch('/api/movements'), fetch('/api/products')])
    setMovements(await mRes.json())
    const prods: Product[] = await pRes.json()
    setProducts(prods)
    if (prods.length && !formProductId) setFormProductId(prods[0].id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selectedProduct = products.find(p => p.id === formProductId)

  function handleProductChange(id: string) {
    setFormProductId(id)
    setFormVariantId('')
  }

  const filtered = typeFilter === 'Todos' ? movements : movements.filter(m => m.type === typeFilter)

  async function handleDelete(id: string) {
    const res = await fetch(`/api/movements/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error, 'error'); return }
    toast('Movimiento eliminado.')
    load()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedProduct?.hasVariants && !formVariantId) {
      toast('Selecciona una variante.', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formProductId,
          variantId: formVariantId || undefined,
          type: formType,
          quantity: Math.abs(formQty),
          note: formNote,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast(`${formType} registrada correctamente.`)
      setShowForm(false)
      setFormQty(1)
      setFormNote('')
      setFormVariantId('')
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Inventario</p>
          <h1>Movimientos de inventario</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={14} />
          Registrar entrada
        </button>
      </div>

      {showForm && (
        <div className="card p-4">
          <p className="card-title mb-3">Registrar compra o ajuste</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="field">
              <label className="label">Producto</label>
              <select className="input text-[12px]" value={formProductId} onChange={e => handleProductChange(e.target.value)}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.hasVariants ? ' (variantes)' : ` (stock: ${p.stock})`}</option>)}
              </select>
            </div>
            {selectedProduct?.hasVariants && (
              <div className="field">
                <label className="label">Variante *</label>
                <select className="input text-[12px]" value={formVariantId} onChange={e => setFormVariantId(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {selectedProduct.variants.map(v => <option key={v.id} value={v.id}>{v.label} (stock: {v.stock})</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label className="label">Tipo</label>
              <select className="input text-[12px]" value={formType} onChange={e => setFormType(e.target.value)}>
                <option value="Compra">Compra (entrada)</option>
                <option value="Ajuste">Ajuste manual</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Cantidad</label>
              <input className="input text-[12px]" type="number" min="1" value={formQty} onChange={e => setFormQty(Number(e.target.value))} required />
            </div>
            <div className="field">
              <label className="label">Nota</label>
              <input className="input text-[12px]" placeholder="Proveedor, referencia…" value={formNote} onChange={e => setFormNote(e.target.value)} />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-title">Historial</span>
          <div className="flex gap-2 items-center flex-wrap">
            <select className="input text-[12px] w-36" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              {['Venta', 'Compra', 'Ajuste', 'Reversa'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn" onClick={load}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="empty-state">Cargando…</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {['Fecha', 'Referencia', 'Producto', 'Tipo', 'Cant.', 'Antes', 'Después', 'Nota', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="empty-state">No hay movimientos registrados.</td></tr>
                ) : (
                  filtered.map(m => (
                    <tr key={m.id}>
                      <td className="text-muted whitespace-nowrap">{formatDate(m.date)}</td>
                      <td className="font-mono text-[11px] text-muted">{m.reference}</td>
                      <td className="font-medium">
                        {m.productName}
                        {m.variantLabel && <span className="text-[10px] text-muted ml-1">· {m.variantLabel}</span>}
                      </td>
                      <td>
                        <span className={cn('badge', typeStyle[m.type] ?? 'badge-info')}>{m.type}</span>
                      </td>
                      <td className={cn('font-medium', m.quantity < 0 ? 'text-danger' : 'text-success')}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="text-muted">{m.stockBefore}</td>
                      <td className="font-semibold">{m.stockAfter}</td>
                      <td className="text-muted text-[11px]">{m.note ?? '—'}</td>
                      <td>
                        <button
                          className="btn-icon hover:!text-danger hover:!border-danger-bg"
                          title="Eliminar"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
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
