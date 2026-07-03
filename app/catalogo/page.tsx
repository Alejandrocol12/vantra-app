'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Layers } from 'lucide-react'
import { formatCurrency, CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Variant { id: string; label: string; stock: number; price: number }
interface Product {
  id: string; name: string; category: string; flavor: string | null; puffs: number | null; image: string | null
  stock: number; price: number; hasVariants: boolean; variants: Variant[]
}

const EMOJIS: Record<string, string> = { Desechable: '🔋', Recargable: '⚡', Pod: '💨', Líquido: '🧪', Accesorio: '🔩' }

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Todas')

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then((all: Product[]) =>
      setProducts(all.filter(p => p.hasVariants ? p.variants.some(v => v.stock > 0) : p.stock > 0))
    )
  }, [])

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase()
    return `${p.name} ${p.flavor ?? ''} ${p.category}`.toLowerCase().includes(q)
      && (cat === 'Todas' || p.category === cat)
  }), [products, search, cat])

  return (
    <div className="min-h-screen" style={{ background: '#07070f' }}>
      {/* Header */}
      <div style={{ background: 'rgba(14,14,28,0.9)', borderBottom: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(8px)' }}
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="sidebar-logo-icon">V</div>
          <span className="sidebar-logo-text text-[18px]">VANTRA</span>
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
                const available = p.hasVariants
                  ? p.variants.filter(v => v.stock > 0).length
                  : p.stock
                const minPrice = p.hasVariants
                  ? Math.min(...p.variants.filter(v => v.stock > 0).map(v => v.price))
                  : p.price

                return (
                  <div key={p.id} className="prod-card flex flex-col">
                    <div className="w-full h-[130px] rounded-lg overflow-hidden bg-surface2 flex items-center justify-center mb-2.5 flex-shrink-0">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-4xl">{EMOJIS[p.category] ?? '📦'}</span>
                      }
                    </div>
                    <div className="flex-1 flex flex-col">
                      <p className="text-[13px] font-semibold leading-snug mb-1 line-clamp-2">{p.name}</p>
                      {p.hasVariants
                        ? <p className="text-[11px] text-brand mb-1 flex items-center gap-1"><Layers size={10} />{available} sabores</p>
                        : <p className="text-[11px] text-muted mb-1 truncate">{[p.flavor, p.puffs ? `${p.puffs.toLocaleString()} puffs` : null].filter(Boolean).join(' · ')}</p>
                      }
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-[14px] font-bold text-brand">
                          {p.hasVariants ? `Desde ${formatCurrency(minPrice)}` : formatCurrency(p.price)}
                        </span>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                          available > 0
                            ? 'bg-success/15 text-success border border-success/20'
                            : 'bg-danger/15 text-danger border border-danger/20'
                        )}>
                          {available > 0 ? 'Disponible' : 'Agotado'}
                        </span>
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
    </div>
  )
}
