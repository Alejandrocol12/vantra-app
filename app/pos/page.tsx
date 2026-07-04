'use client'

import { useEffect, useState, useMemo } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, Search, X, Layers } from 'lucide-react'
import { formatCurrency, CATEGORIES, PAYMENT_METHODS } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface Variant { id: string; label: string; stock: number; price: number }
interface Product {
  id: string; name: string; category: string; flavor: string | null; image: string | null
  stock: number; price: number; hasVariants: boolean; variants: Variant[]
}
interface CartItem {
  productId: string; variantId?: string; name: string; variantLabel?: string
  price: number; quantity: number; maxStock: number
}

const EMOJIS: Record<string, string> = { Desechable: '🔋', Recargable: '⚡', Pod: '💨', Líquido: '🧪', Accesorio: '🔩' }

function cartKey(item: CartItem) { return item.variantId ?? item.productId }

export default function PosPage() {
  const { messages, toast, dismiss } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [payment, setPayment] = useState('Efectivo')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState<{ id: string; name: string; deuda: number }[]>([])
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  async function loadProducts() {
    const res = await fetch('/api/products')
    const all: Product[] = await res.json()
    setProducts(all)
  }
  async function loadClientes() {
    const res = await fetch('/api/clientes')
    setClientes(await res.json())
  }
  useEffect(() => { loadProducts(); loadClientes() }, [])

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase()
    return `${p.name} ${p.flavor ?? ''} ${p.category}`.toLowerCase().includes(q)
      && (categoryFilter === 'Todas' || p.category === categoryFilter)
  }), [products, search, categoryFilter])

  function addToCart(product: Product) {
    if (product.hasVariants) { setPickerProduct(product); return }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id && !i.variantId)
      if (existing) {
        if (existing.quantity >= existing.maxStock) { toast(`Solo hay ${product.stock} ud. de "${product.name}".`, 'error'); return prev }
        return prev.map(i => cartKey(i) === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, maxStock: product.stock }]
    })
  }

  function addVariantToCart(product: Product, variant: Variant) {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id)
      if (existing) {
        if (existing.quantity >= existing.maxStock) { toast(`Solo hay ${variant.stock} ud. de "${variant.label}".`, 'error'); return prev }
        return prev.map(i => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, variantId: variant.id, name: product.name, variantLabel: variant.label, price: variant.price, quantity: 1, maxStock: variant.stock }]
    })
    setPickerProduct(null)
  }

  function changeQty(key: string, delta: number) {
    setCart(prev => {
      const item = prev.find(i => cartKey(i) === key)
      if (!item) return prev
      const next = item.quantity + delta
      if (next <= 0) return prev.filter(i => cartKey(i) !== key)
      if (next > item.maxStock) return prev
      return prev.map(i => cartKey(i) === key ? { ...i, quantity: next } : i)
    })
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalUnits = cart.reduce((s, i) => s + i.quantity, 0)

  async function handleCheckout() {
    if (!cart.length) { toast('Agrega productos al carrito primero.', 'error'); return }
    if (payment === 'Fiado' && !clienteId) { toast('Selecciona un cliente para el fiado.', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          payment, note, clienteId: clienteId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast(`Venta ${data.reference} registrada.`)
      setCart([]); setNote(''); setClienteId(''); setCartOpen(false)
      loadProducts(); loadClientes()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Punto de venta</p>
        <h1>Punto de venta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Product catalog */}
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input className="input pl-7 text-[12px]" placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-36 text-[12px]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="Todas">Todas</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {filtered.length === 0
            ? <p className="text-center text-muted py-10 text-[12px]">No hay productos con stock disponible.</p>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(p => {
                  const cartItems = cart.filter(i => i.productId === p.id)
                  const inCartQty = cartItems.reduce((s, i) => s + i.quantity, 0)
                  const totalStock = p.hasVariants ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock
                  const outOfStock = totalStock === 0
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'prod-card select-none',
                        outOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        !outOfStock && inCartQty > 0 && 'border-brand/50 bg-brand/[0.06]'
                      )}
                      onClick={() => !outOfStock && addToCart(p)}
                    >
                      <div className="w-full h-[140px] rounded-lg overflow-hidden bg-surface2 flex items-center justify-center mb-3 relative">
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-4xl">{EMOJIS[p.category] ?? '📦'}</span>
                        }
                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(7,7,15,0.55)' }}>
                            <span className="text-[11px] font-bold text-danger bg-danger/15 border border-danger/30 px-2 py-1 rounded-full">Sin unidades</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold leading-snug mb-1 line-clamp-2">{p.name}</p>
                      {p.hasVariants
                        ? <p className="text-[11px] text-brand mb-1 flex items-center gap-1"><Layers size={10} />{p.variants.filter(v => v.stock > 0).length} sabores disponibles</p>
                        : p.flavor && <p className="text-[11px] text-muted mb-1 truncate">{p.flavor}</p>
                      }
                      {!p.hasVariants && <p className="text-[14px] text-brand font-bold mt-1">{formatCurrency(p.price)}</p>}
                      <p className="text-[11px] text-muted mt-0.5">Stock: {totalStock}</p>
                      {inCartQty > 0 && (
                        <div className="mt-2 text-center text-[11px] font-bold text-[#07070c] bg-brand rounded-md py-0.5">
                          En carrito: {inCartQty}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        {/* Cart — desktop only */}
        <div className="card hidden lg:flex flex-col gap-3 p-4 self-start lg:sticky lg:top-4">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <ShoppingCart size={15} />
            Carrito
            {totalUnits > 0 && <span className="ml-auto badge badge-info">{totalUnits} uds</span>}
          </div>

          {cart.length === 0
            ? <p className="text-[12px] text-muted text-center py-4">Selecciona productos del catálogo</p>
            : (
              <div>
                {cart.map(item => (
                  <div key={cartKey(item)} className="cart-item">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-snug truncate">{item.name}</p>
                      {item.variantLabel && <p className="text-[10px] text-muted">{item.variantLabel}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="qty-btn" onClick={() => changeQty(cartKey(item), -1)}>−</button>
                      <span className="text-[12px] min-w-[18px] text-center">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => changeQty(cartKey(item), 1)}>+</button>
                    </div>
                    <p className="text-[12px] font-medium min-w-[60px] text-right">{formatCurrency(item.price * item.quantity)}</p>
                    <button className="btn-icon !w-5 !h-5 !border-0 text-danger hover:bg-danger-bg ml-0.5" onClick={() => setCart(prev => prev.filter(i => cartKey(i) !== cartKey(item)))}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )
          }

          <div className="border-t border-white/[0.08] pt-3 space-y-1.5">
            <div className="flex justify-between text-[12px] text-muted">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[15px]">
              <span>Total</span><span>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <select className="input text-[12px]" value={payment} onChange={e => { setPayment(e.target.value); if (e.target.value !== 'Fiado') setClienteId('') }}>
            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
          </select>

          {payment === 'Fiado' && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Cliente *</p>
              <select className="input text-[12px]" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}{c.deuda > 0 ? ` · debe ${formatCurrency(c.deuda)}` : ''}</option>)}
              </select>
              {clientes.length === 0 && <a href="/fiado" className="text-[11px] text-brand underline">Crear cliente</a>}
            </div>
          )}

          <textarea className="input text-[12px] resize-none" rows={2} placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} />

          <button onClick={handleCheckout} disabled={saving || !cart.length} className="btn-primary w-full justify-center py-2.5 text-[13px]">
            {saving ? 'Procesando…' : 'Registrar venta'}
          </button>
        </div>
      </div>

      {/* ── Floating cart button (mobile) ── */}
      <button
        onClick={() => setCartOpen(true)}
        className="lg:hidden fixed bottom-[72px] right-4 z-40 btn-primary flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl"
        style={{ boxShadow: '0 0 24px rgba(217,70,239,0.4), 0 4px 16px rgba(0,0,0,0.4)' }}
      >
        <ShoppingCart size={18} />
        {totalUnits > 0 && (
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">
            {totalUnits}
          </span>
        )}
        <span className="text-[13px] font-bold">{formatCurrency(subtotal)}</span>
      </button>

      {/* ── Mobile cart drawer ── */}
      {cartOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl flex flex-col"
            style={{ maxHeight: '82vh', background: 'rgba(10,10,22,0.98)', border: '1px solid rgba(139,92,246,0.28)', borderBottom: 'none' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <ShoppingCart size={15} />
                Carrito
                {totalUnits > 0 && <span className="badge badge-info">{totalUnits} uds</span>}
              </div>
              <button onClick={() => setCartOpen(false)} className="btn-icon"><X size={14} /></button>
            </div>

            {/* Drawer body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cart.length === 0
                ? <p className="text-[12px] text-muted text-center py-6">Selecciona productos del catálogo</p>
                : (
                  <div>
                    {cart.map(item => (
                      <div key={cartKey(item)} className="cart-item">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] leading-snug truncate">{item.name}</p>
                          {item.variantLabel && <p className="text-[10px] text-muted">{item.variantLabel}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button className="qty-btn" onClick={() => changeQty(cartKey(item), -1)}>−</button>
                          <span className="text-[12px] min-w-[18px] text-center">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => changeQty(cartKey(item), 1)}>+</button>
                        </div>
                        <p className="text-[12px] font-medium min-w-[60px] text-right">{formatCurrency(item.price * item.quantity)}</p>
                        <button className="btn-icon !w-5 !h-5 !border-0 text-danger hover:bg-danger-bg ml-0.5" onClick={() => setCart(prev => prev.filter(i => cartKey(i) !== cartKey(item)))}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              }

              <div className="border-t border-white/[0.08] pt-3 space-y-1.5">
                <div className="flex justify-between text-[12px] text-muted">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[15px]">
                  <span>Total</span><span>{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <select className="input text-[12px]" value={payment} onChange={e => { setPayment(e.target.value); if (e.target.value !== 'Fiado') setClienteId('') }}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>

              {payment === 'Fiado' && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Cliente *</p>
                  <select className="input text-[12px]" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.name}{c.deuda > 0 ? ` · debe ${formatCurrency(c.deuda)}` : ''}</option>)}
                  </select>
                  {clientes.length === 0 && <a href="/fiado" className="text-[11px] text-brand underline">Crear cliente</a>}
                </div>
              )}

              <textarea className="input text-[12px] resize-none" rows={2} placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} />

              <button onClick={handleCheckout} disabled={saving || !cart.length} className="btn-primary w-full justify-center py-2.5 text-[13px]">
                {saving ? 'Procesando…' : 'Registrar venta'}
              </button>

              {/* extra bottom padding to clear BottomNav */}
              <div className="h-2" />
            </div>
          </div>
        </>
      )}

      {/* ── Variant picker modal ── */}
      {pickerProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPickerProduct(null)}>
          <div className="bg-surface border border-white/[0.1] rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-[15px]">{pickerProduct.name}</p>
                <p className="text-[12px] text-muted mt-0.5">Selecciona una variante</p>
              </div>
              <button onClick={() => setPickerProduct(null)} className="btn-icon shrink-0"><X size={14} /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pickerProduct.variants.filter(v => v.stock > 0).map(v => {
                const inCart = cart.find(i => i.variantId === v.id)
                return (
                  <button
                    key={v.id}
                    onClick={() => addVariantToCart(pickerProduct, v)}
                    className={cn(
                      'w-full flex justify-between items-center px-4 py-3 rounded-xl border text-[13px] transition-colors text-left',
                      inCart ? 'border-brand bg-brand/10' : 'border-white/[0.1] bg-surface2 hover:bg-white/[0.07]'
                    )}
                  >
                    <div>
                      <p className="font-medium">{v.label}</p>
                      {inCart && <p className="text-[11px] text-brand mt-0.5">En carrito: {inCart.quantity}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-brand">{formatCurrency(v.price)}</p>
                      <p className="text-[11px] text-muted">Stock: {v.stock}</p>
                    </div>
                  </button>
                )
              })}
              {pickerProduct.variants.filter(v => v.stock > 0).length === 0 && (
                <p className="text-center text-muted py-6 text-[12px]">No hay variantes con stock.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
