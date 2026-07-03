'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Layers, MessageCircle, Plus, Minus, ShoppingCart, X, ChevronRight } from 'lucide-react'
import { formatCurrency, CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Variant { id: string; label: string; stock: number; price: number }
interface Product {
  id: string; name: string; category: string; flavor: string | null; puffs: number | null; image: string | null
  stock: number; price: number; hasVariants: boolean; variants: Variant[]
}
interface CartItem {
  key: string
  product: Product
  variant: Variant | null
  qty: number
}

const EMOJIS: Record<string, string> = { Desechable: '🔋', Recargable: '⚡', Pod: '💨', Líquido: '🧪', Accesorio: '🔩' }

function CatalogoContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('u')

  const [products, setProducts] = useState<Product[]>([])
  const [storeName, setStoreName] = useState('')
  const [whatsapp, setWhatsapp] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Todas')
  const [notFound, setNotFound] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  // variant picker state
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!userId) { setNotFound(true); return }
    fetch(`/api/public?u=${userId}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then((d) => {
        if (!d) return
        setStoreName(d.storeName)
        setWhatsapp(d.whatsappNumber)
        setProducts((d.products as Product[]).filter(p =>
          p.hasVariants ? p.variants.some(v => v.stock > 0) : p.stock > 0
        ))
      })
  }, [userId])

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase()
    return `${p.name} ${p.flavor ?? ''} ${p.category}`.toLowerCase().includes(q)
      && (cat === 'Todas' || p.category === cat)
  }), [products, search, cat])

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  function addItem(product: Product, variant: Variant | null) {
    const key = variant ? `${product.id}-${variant.id}` : product.id
    setCart(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { key, product, variant, qty: 1 }]
    })
  }

  function changeQty(key: string, delta: number, maxStock?: number) {
    setCart(prev => prev.flatMap(i => {
      if (i.key !== key) return [i]
      const newQty = i.qty + delta
      if (newQty <= 0) return []
      if (maxStock !== undefined && newQty > maxStock) return [i]
      return [{ ...i, qty: newQty }]
    }))
  }

  function removeItem(key: string) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  function getCartQtyForProduct(productId: string) {
    return cart.filter(i => i.product.id === productId).reduce((s, i) => s + i.qty, 0)
  }

  function handleAddClick(p: Product) {
    if (p.hasVariants) {
      setPickerProduct(p)
    } else {
      addItem(p, null)
    }
  }

  function sendOrder() {
    if (!whatsapp || cart.length === 0) return
    const lines = cart.map(({ product: p, variant: v, qty }) => {
      const label = v ? `${p.name} — ${v.label}` : p.name
      const puffsText = !v && p.puffs ? ` (${p.puffs.toLocaleString()} puffs)` : ''
      const price = v ? v.price : p.price
      return `• *${label}${puffsText}*\n  Cantidad: ${qty} · ${formatCurrency(price)} c/u`
    }).join('\n\n')

    const msg = encodeURIComponent(`Hola! Quisiera hacer el siguiente pedido:\n\n${lines}\n\n¿Está todo disponible?`)
    const phone = whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}>
      <p className="text-muted text-[13px]">Catálogo no encontrado.</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: '#07070f' }}>
      {/* Header */}
      <div style={{ background: 'rgba(14,14,28,0.9)', borderBottom: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(8px)' }}
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="sidebar-logo-icon">V</div>
          <span className="sidebar-logo-text text-[18px]">{storeName || 'VANTRA'}</span>
        </div>
        <span className="text-[11px] text-muted">Catálogo de productos</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input className="input pl-7 text-[12px] w-full" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input text-[12px] w-36" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="Todas">Todas</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? <p className="text-center text-muted py-16 text-[13px]">No hay productos disponibles.</p>
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(p => {
                const availableVariants = p.hasVariants ? p.variants.filter(v => v.stock > 0) : []
                const available = p.hasVariants ? availableVariants.length : p.stock
                const minPrice = p.hasVariants
                  ? Math.min(...availableVariants.map(v => v.price))
                  : p.price
                const cartQty = getCartQtyForProduct(p.id)

                return (
                  <div key={p.id} className={cn('prod-card flex flex-col transition-all', cartQty > 0 && 'ring-1 ring-brand/40')} style={cartQty > 0 ? { background: 'rgba(139,92,246,0.06)' } : {}}>
                    <div className="w-full h-[130px] rounded-lg overflow-hidden bg-surface2 flex items-center justify-center mb-2.5 flex-shrink-0 relative">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-4xl">{EMOJIS[p.category] ?? '📦'}</span>
                      }
                      {cartQty > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white">
                          {cartQty}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <p className="text-[13px] font-semibold leading-snug mb-1 line-clamp-2">{p.name}</p>
                      {p.hasVariants
                        ? <p className="text-[11px] text-brand mb-1 flex items-center gap-1"><Layers size={10} />{availableVariants.length} sabores disponibles</p>
                        : <p className="text-[11px] text-muted mb-1 truncate">{[p.flavor, p.puffs ? `${p.puffs.toLocaleString()} puffs` : null].filter(Boolean).join(' · ')}</p>
                      }
                      <div className="mt-auto pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-bold text-brand">
                            {p.hasVariants ? `Desde ${formatCurrency(minPrice)}` : formatCurrency(p.price)}
                          </span>
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            available > 0 ? 'bg-success/15 text-success border border-success/20' : 'bg-danger/15 text-danger border border-danger/20'
                          )}>
                            {available > 0 ? 'Disponible' : 'Agotado'}
                          </span>
                        </div>
                        {whatsapp && available > 0 && (
                          p.hasVariants ? (
                            <button
                              onClick={() => handleAddClick(p)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-90"
                              style={{ background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)' }}
                            >
                              <Layers size={11} />
                              Elegir sabor
                              <ChevronRight size={11} />
                            </button>
                          ) : (
                            cartQty > 0 ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => changeQty(p.id, -1)} className="flex-none w-7 h-7 rounded-lg flex items-center justify-center text-brand" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                  <Minus size={11} />
                                </button>
                                <span className="flex-1 text-center text-[13px] font-bold">{cartQty}</span>
                                <button onClick={() => changeQty(p.id, 1, p.stock)} disabled={cartQty >= p.stock} className="flex-none w-7 h-7 rounded-lg flex items-center justify-center text-brand disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                  <Plus size={11} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddClick(p)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-90"
                                style={{ background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)' }}
                              >
                                <Plus size={12} />
                                Agregar al pedido
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        <p className="text-center text-[11px] text-muted pt-4">
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Floating cart button */}
      {whatsapp && totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-[13px] shadow-xl"
            style={{ background: '#25d366', color: '#fff', boxShadow: '0 4px 24px rgba(37,211,102,0.4)' }}
          >
            <ShoppingCart size={16} />
            Ver pedido ({totalItems} producto{totalItems !== 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Variant picker modal */}
      {pickerProduct && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPickerProduct(null) }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: '#0e0e1c', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-semibold text-[13px]">{pickerProduct.name}</p>
                <p className="text-[11px] text-muted">Elige el sabor que deseas</p>
              </div>
              <button onClick={() => setPickerProduct(null)} className="btn-icon"><X size={14} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {pickerProduct.variants.filter(v => v.stock > 0).map(v => {
                const key = `${pickerProduct.id}-${v.id}`
                const inCart = cart.find(i => i.key === key)
                return (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold">{v.label}</p>
                      <p className="text-[11px] text-brand font-bold">{formatCurrency(v.price)}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(key, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                          <Minus size={11} />
                        </button>
                        <span className="w-5 text-center text-[13px] font-bold">{inCart.qty}</span>
                        <button onClick={() => changeQty(key, 1, v.stock)} disabled={inCart.qty >= v.stock} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                          <Plus size={11} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(pickerProduct, v)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                        style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)' }}
                      >
                        <Plus size={11} /> Agregar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setPickerProduct(null)}
                className="w-full py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false) }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: '#0e0e1c', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-semibold text-[14px]">Tu pedido</span>
              <button onClick={() => setShowCart(false)} className="btn-icon"><X size={14} /></button>
            </div>
            <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
              {cart.map(({ key, product: p, variant: v, qty }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface2 flex items-center justify-center flex-shrink-0 text-lg">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : EMOJIS[p.category] ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{p.name}{v ? ` — ${v.label}` : ''}</p>
                    <p className="text-[11px] text-muted">{formatCurrency(v ? v.price : p.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => changeQty(key, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-brand" style={{ background: 'rgba(139,92,246,0.15)' }}><Minus size={10} /></button>
                    <span className="w-5 text-center text-[12px] font-bold">{qty}</span>
                    <button onClick={() => changeQty(key, 1, variant ? variant.stock : product.stock)} disabled={qty >= (variant ? variant.stock : product.stock)} className="w-6 h-6 rounded-md flex items-center justify-center text-brand disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.15)' }}><Plus size={10} /></button>
                  </div>
                  <button onClick={() => removeItem(key)} className="btn-icon ml-1"><X size={12} /></button>
                </div>
              ))}
            </div>
            <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { sendOrder(); setShowCart(false) }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13px]"
                style={{ background: '#25d366', color: '#fff', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}
              >
                <MessageCircle size={15} />
                Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense>
      <CatalogoContent />
    </Suspense>
  )
}
