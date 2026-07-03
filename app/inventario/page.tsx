'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, Plus, Search, ImagePlus, X, ChevronDown, ChevronUp, Layers, Check, Link2 } from 'lucide-react'
import { formatCurrency, CATEGORIES } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import StockBar, { StockBadge } from '@/components/StockBar'
import { cn } from '@/lib/utils'

interface Variant {
  id: string; label: string; stock: number; minStock: number; cost: number; price: number
}
interface Product {
  id: string; name: string; category: string; flavor: string | null; puffs: number | null; image: string | null
  stock: number; minStock: number; cost: number; price: number; hasVariants: boolean
  variants: Variant[]
}

const EMOJIS: Record<string, string> = { Desechable: '🔋', Recargable: '⚡', Pod: '💨', Líquido: '🧪', Accesorio: '🔩' }
const emptyForm = { name: '', category: 'Desechable', flavor: '', puffs: '', stock: 0, minStock: 0, cost: 0, price: 0, hasVariants: false }
const emptyVForm = { label: '', stock: 0, minStock: 0, cost: 0, price: 0 }

function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const res = await fetch('/api/me')
    const me = await res.json()
    const url = `${window.location.origin}/catalogo?u=${me.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="btn shrink-0 text-[12px]" style={copied ? { color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' } : {}}>
      {copied ? <Check size={13} /> : <Link2 size={13} />}
      {copied ? 'Enlace copiado' : 'Compartir catálogo'}
    </button>
  )
}

export default function InventarioPage() {
  const { messages, toast, dismiss } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Variant management
  const [vForm, setVForm] = useState({ ...emptyVForm })
  const [editVId, setEditVId] = useState<string | null>(null)
  const [showVForm, setShowVForm] = useState(false)
  const [savingV, setSavingV] = useState(false)

  // WhatsApp config
  const [whatsappInput, setWhatsappInput] = useState('')
  const [savingWa, setSavingWa] = useState(false)

  async function load() {
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }
  async function loadMe() {
    const res = await fetch('/api/me')
    const me = await res.json()
    setWhatsappInput(me.whatsappNumber ?? '')
  }
  useEffect(() => { load(); loadMe() }, [])

  async function saveWhatsapp() {
    setSavingWa(true)
    await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsappNumber: whatsappInput }) })
    setSavingWa(false)
    toast('Número de WhatsApp guardado.', 'success')
  }

  function startEdit(p: Product) {
    setEditId(p.id); setExpandedId(null)
    setForm({ name: p.name, category: p.category, flavor: p.flavor ?? '', puffs: p.puffs ? String(p.puffs) : '', stock: p.stock, minStock: p.minStock, cost: p.cost, price: p.price, hasVariants: p.hasVariants })
    setImageFile(null); setImagePreview(p.image)
    setShowVForm(false); setEditVId(null); setVForm({ ...emptyVForm })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null); setForm({ ...emptyForm })
    setImageFile(null); setImagePreview(null)
    setShowVForm(false); setEditVId(null); setVForm({ ...emptyVForm })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast('La imagen no puede superar 3 MB.', 'error'); return }
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.hasVariants && Number(form.price) < Number(form.cost)) { toast('El precio debe ser ≥ al costo.', 'error'); return }
    setSaving(true)
    try {
      const body = form.hasVariants
        ? { name: form.name, category: form.category, flavor: null, puffs: form.puffs ? Number(form.puffs) : null, stock: 0, minStock: 0, cost: 0, price: 0 }
        : { ...form, puffs: form.puffs ? Number(form.puffs) : null }
      const res = await fetch(editId ? `/api/products/${editId}` : '/api/products', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast((await res.json()).error, 'error'); return }
      const saved = await res.json()
      const productId = editId ?? saved.id
      if (imageFile && productId) {
        const fd = new FormData(); fd.append('image', imageFile)
        await fetch(`/api/products/${productId}/image`, { method: 'POST', body: fd })
      }
      toast(editId ? 'Producto actualizado.' : 'Producto agregado.')
      if (!editId) { setEditId(productId); setForm(f => ({ ...f, ...body, flavor: body.flavor ?? '', puffs: body.puffs ? String(body.puffs) : '' })) } else cancelEdit()
      load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error, 'error'); return }
    toast('Producto eliminado.'); load()
  }

  // ── Variant handlers ──
  function startEditVariant(v: Variant) {
    setEditVId(v.id); setShowVForm(true)
    setVForm({ label: v.label, stock: v.stock, minStock: v.minStock, cost: v.cost, price: v.price })
  }

  function cancelVForm() { setShowVForm(false); setEditVId(null); setVForm({ ...emptyVForm }) }

  async function saveVariant(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    if (!vForm.label.trim()) { toast('El nombre de la variante es requerido.', 'error'); return }
    if (Number(vForm.price) < Number(vForm.cost)) { toast('El precio debe ser ≥ al costo.', 'error'); return }
    setSavingV(true)
    try {
      const url = editVId
        ? `/api/products/${editId}/variants/${editVId}`
        : `/api/products/${editId}/variants`
      const res = await fetch(url, {
        method: editVId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vForm),
      })
      if (!res.ok) { toast((await res.json()).error, 'error'); return }
      toast(editVId ? 'Variante actualizada.' : 'Variante agregada.')
      cancelVForm(); load()
    } finally { setSavingV(false) }
  }

  async function deleteVariant(variantId: string) {
    if (!editId) return
    const res = await fetch(`/api/products/${editId}/variants/${variantId}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error, 'error'); return }
    toast('Variante eliminada.'); load()
  }

  async function removeImage(id: string) {
    await fetch(`/api/products/${id}/image`, { method: 'DELETE' })
    setImagePreview(null); setImageFile(null); load()
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return `${p.name} ${p.flavor ?? ''} ${p.category}`.toLowerCase().includes(q)
      && (categoryFilter === 'Todas' || p.category === categoryFilter)
  })

  const editProduct = editId ? products.find(p => p.id === editId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Inventario</p>
          <h1>Productos</h1>
        </div>
        <CopyLinkButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        {/* ── Left panel ── */}
        <div className="space-y-3">
          {/* Product form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-head">
              <span className="card-title">{editId ? 'Editar producto' : 'Nuevo producto'}</span>
              {editId && <button type="button" onClick={cancelEdit} className="btn-icon"><X size={13} /></button>}
            </div>
            <div className="p-4 space-y-3">
              {/* Image */}
              <div className="field">
                <label className="label">Imagen</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border border-white/[0.1] bg-surface2 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity" onClick={() => fileRef.current?.click()}>
                    {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <span>{EMOJIS[form.category] ?? '📦'}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn text-[11px] py-1"><ImagePlus size={12} />{imagePreview ? 'Cambiar' : 'Subir'}</button>
                    {imagePreview && <button type="button" onClick={() => editId ? removeImage(editId) : (setImageFile(null), setImagePreview(null))} className="btn text-[11px] py-1 hover:!text-danger"><X size={11} /> Quitar</button>}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
              </div>

              <div className="field">
                <label className="label">Nombre</label>
                <input className="input text-[12px]" required placeholder="Ej. Elf Bar BC5000" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="field">
                <label className="label">Categoría</label>
                <select className="input text-[12px]" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Variants toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  className={cn('w-9 h-5 rounded-full transition-colors relative', form.hasVariants ? 'bg-brand' : 'bg-white/10')}
                  onClick={() => setForm(f => ({ ...f, hasVariants: !f.hasVariants }))}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', form.hasVariants ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-[12px] text-muted">Activar variantes <span className="text-subtle">(sabores, tamaños…)</span></span>
              </label>

              {!form.hasVariants && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="field">
                      <label className="label">Sabor / ref.</label>
                      <input className="input text-[12px]" placeholder="Mango Ice" value={form.flavor} onChange={e => setForm(f => ({ ...f, flavor: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="label">Puffs</label>
                      <input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" placeholder="3500" value={form.puffs} onChange={e => setForm(f => ({ ...f, puffs: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="field"><label className="label">Stock</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" required value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} /></div>
                    <div className="field"><label className="label">Stock mínimo</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" required value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="field"><label className="label">Costo</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" step="100" required value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} /></div>
                    <div className="field"><label className="label">Precio venta</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" step="100" required value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
                  </div>
                </>
              )}

              {form.hasVariants && (
                <p className="text-[11px] text-muted bg-surface2 rounded-lg px-3 py-2 border border-white/[0.07]">
                  Guarda el producto primero. Luego agrega las variantes (sabores, tamaños, etc.) desde el panel de variantes.
                </p>
              )}

              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                <Plus size={13} />
                {saving ? 'Guardando…' : editId ? 'Actualizar' : 'Agregar producto'}
              </button>
            </div>
          </form>

          {/* ── Variant panel ── */}
          {editId && form.hasVariants && (
            <div className="card">
              <div className="card-head">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-brand" />
                  <span className="card-title">Variantes</span>
                  <span className="badge badge-info">{editProduct?.variants.length ?? 0}</span>
                </div>
                <button onClick={() => { setShowVForm(true); setEditVId(null); setVForm({ ...emptyVForm }) }} className="btn-primary text-[11px] py-1 px-2.5">
                  <Plus size={12} /> Agregar
                </button>
              </div>

              {/* Variant list */}
              {(editProduct?.variants ?? []).length === 0 && !showVForm && (
                <p className="empty-state py-6">Agrega la primera variante.</p>
              )}
              {(editProduct?.variants ?? []).map(v => (
                <div key={v.id} className={cn('flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05]', editVId === v.id && 'bg-brand/5')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium">{v.label}</p>
                    <p className="text-[11px] text-muted">Stock: <span className={cn(v.stock === 0 ? 'text-danger' : v.stock < v.minStock ? 'text-warn' : 'text-success')}>{v.stock}</span> · Mín: {v.minStock} · {formatCurrency(v.price)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-icon" onClick={() => startEditVariant(v)}><Pencil size={11} /></button>
                    <button className="btn-icon hover:!text-danger" onClick={() => deleteVariant(v.id)}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}

              {/* Variant form */}
              {showVForm && (
                <form onSubmit={saveVariant} className="p-4 border-t border-white/[0.07] space-y-3">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{editVId ? 'Editar variante' : 'Nueva variante'}</p>
                  <div className="field">
                    <label className="label">Nombre / sabor</label>
                    <input className="input text-[12px]" required placeholder="Mango Ice" value={vForm.label} onChange={e => setVForm(f => ({ ...f, label: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="field"><label className="label">Stock</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" value={vForm.stock} onChange={e => setVForm(f => ({ ...f, stock: Number(e.target.value) }))} /></div>
                    <div className="field"><label className="label">Stock mínimo</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" value={vForm.minStock} onChange={e => setVForm(f => ({ ...f, minStock: Number(e.target.value) }))} /></div>
                    <div className="field"><label className="label">Costo</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" step="100" value={vForm.cost} onChange={e => setVForm(f => ({ ...f, cost: Number(e.target.value) }))} /></div>
                    <div className="field"><label className="label">Precio venta</label><input className="input text-[12px]" type="number" onFocus={e => e.target.select()} min="0" step="100" value={vForm.price} onChange={e => setVForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingV} className="btn-primary flex-1 justify-center text-[12px]">
                      {savingV ? 'Guardando…' : editVId ? 'Actualizar' : 'Agregar variante'}
                    </button>
                    <button type="button" onClick={cancelVForm} className="btn">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          )}
          {/* WhatsApp config */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">WhatsApp de la tienda</span>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[11px] text-muted">Los clientes del catálogo podrán hacer pedidos a este número.</p>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-[12px]"
                  placeholder="+57 300 000 0000"
                  value={whatsappInput}
                  onChange={e => setWhatsappInput(e.target.value)}
                />
                <button onClick={saveWhatsapp} disabled={savingWa} className="btn-primary text-[12px]">
                  {savingWa ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Table ── */}
        <div className="card">
          <div className="card-head flex-wrap gap-2">
            <span className="card-title">Inventario ({filtered.length})</span>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input className="input text-[12px] pl-7 w-40" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input text-[12px] w-32" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="Todas">Todas</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? <p className="empty-state">Cargando…</p> : (
              <table className="tbl">
                <thead>
                  <tr>{['', 'Producto', 'Cat.', 'Venta', 'Stock', 'Nivel', 'Estado', ''].map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={8} className="empty-state">No hay productos.</td></tr>
                    : filtered.map(p => {
                      const totalStock = p.hasVariants ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock
                      const totalMinStock = p.hasVariants ? (p.variants.length > 0 ? Math.min(...p.variants.map(v => v.minStock)) : 0) : p.minStock
                      const isExpanded = expandedId === p.id
                      return (
                        <>
                          <tr key={p.id} className={cn(isExpanded && 'bg-white/[0.02]')}>
                            <td className="!pr-1">
                              <div className="w-9 h-9 rounded-lg bg-surface2 border border-white/[0.08] overflow-hidden flex items-center justify-center text-base cursor-pointer hover:opacity-75" onClick={() => startEdit(p)}>
                                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span>{EMOJIS[p.category] ?? '📦'}</span>}
                              </div>
                            </td>
                            <td>
                              <p className="font-medium text-[12px]">{p.name}</p>
                              {p.hasVariants
                                ? <p className="text-[11px] text-brand flex items-center gap-1"><Layers size={10} />{p.variants.length} variantes</p>
                                : <p className="text-[11px] text-muted">{[p.flavor, p.puffs ? `${p.puffs.toLocaleString()} puffs` : null].filter(Boolean).join(' · ')}</p>
                              }
                            </td>
                            <td className="text-muted">{p.category}</td>
                            <td className="font-medium">{p.hasVariants ? <span className="text-muted text-[11px]">—</span> : formatCurrency(p.price)}</td>
                            <td className={cn('font-semibold', totalStock === 0 ? 'text-danger' : '')}>{totalStock}</td>
                            <td>{!p.hasVariants && <StockBar stock={p.stock} minStock={p.minStock} />}</td>
                            <td>{!p.hasVariants && <StockBadge stock={p.stock} minStock={p.minStock} />}</td>
                            <td>
                              <div className="flex gap-1">
                                {p.hasVariants && (
                                  <button className="btn-icon" title="Ver variantes" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  </button>
                                )}
                                <button className="btn-icon" title="Editar" onClick={() => startEdit(p)}><Pencil size={11} /></button>
                                <button className="btn-icon hover:!text-danger" title="Eliminar" onClick={() => handleDelete(p.id)}><Trash2 size={11} /></button>
                              </div>
                            </td>
                          </tr>
                          {/* Variant rows */}
                          {isExpanded && p.variants.map(v => (
                            <tr key={v.id} className="bg-surface2/30">
                              <td></td>
                              <td className="!pl-5">
                                <p className="text-[12px] text-muted before:content-['↳_']">{v.label}</p>
                              </td>
                              <td></td>
                              <td className="text-[12px]">{formatCurrency(v.price)}</td>
                              <td className={cn('text-[12px] font-semibold', v.stock === 0 ? 'text-danger' : v.stock < v.minStock ? 'text-warn' : '')}>{v.stock}</td>
                              <td><StockBar stock={v.stock} minStock={v.minStock} /></td>
                              <td><StockBadge stock={v.stock} minStock={v.minStock} /></td>
                              <td></td>
                            </tr>
                          ))}
                        </>
                      )
                    })
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
