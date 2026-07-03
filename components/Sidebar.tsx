'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, ArrowLeftRight, BarChart3, Bell, Users, FileText, LogOut, Share2, Copy, Check, MessageCircle, X } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import { stockStatus } from './StockBar'
import { cn } from '@/lib/utils'

const sections = [
  {
    label: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pos', label: 'Punto de venta', icon: ShoppingBag },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { href: '/inventario', label: 'Productos', icon: Package },
      { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/fiado', label: 'Fiado / Créditos', icon: Users },
    ],
  },
  {
    label: 'Reportes',
    items: [
      { href: '/ventas', label: 'Ventas', icon: BarChart3 },
      { href: '/alertas', label: 'Alertas', icon: Bell, badge: true },
      { href: '/reportes', label: 'Exportar', icon: FileText },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { open, close } = useSidebar()
  const [alertCount, setAlertCount] = useState(0)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const catalogUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/catalogo`
    : 'https://vantra-app.vercel.app/catalogo'

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  async function handleCopy() {
    await navigator.clipboard.writeText(catalogUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(`¡Mira nuestro catálogo de productos! 👇\n${catalogUrl}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Catálogo', url: catalogUrl })
    } else {
      setShowShare(true)
    }
  }

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((products: { stock: number; minStock: number; hasVariants: boolean; variants: { stock: number; minStock: number }[] }[]) => {
        let count = 0
        for (const p of products) {
          if (p.hasVariants) {
            if (p.variants.some(v => stockStatus(v.stock, v.minStock) !== 'ok')) count++
          } else {
            if (stockStatus(p.stock, p.minStock) !== 'ok') count++
          }
        }
        setAlertCount(count)
      })
      .catch(() => {})
  }, [pathname])

  useEffect(() => { close() }, [pathname])

  // Close share popover when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false)
      }
    }
    if (showShare) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showShare])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'sidebar-root fixed top-0 left-0 h-full w-[220px] flex flex-col z-30',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="sidebar-brand-border px-4 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div className="sidebar-logo-icon">V</div>
            <div>
              <p className="sidebar-logo-text">VANTRA</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Sistema de gestión</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map(section => (
            <div key={section.label}>
              <p className="sidebar-section-label">{section.label}</p>
              {section.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn('sidebar-link', active && 'active')}
                  >
                    <Icon size={15} />
                    {label}
                    {badge && alertCount > 0 && (
                      <span
                        className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(248,113,113,0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(248,113,113,0.25)',
                        }}
                      >
                        {alertCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Share catalog */}
        <div className="px-3 pb-2 relative" ref={shareRef}>
          <button
            onClick={() => { if ('share' in navigator) { handleNativeShare() } else { setShowShare(v => !v) } }}
            className="sidebar-link w-full text-brand"
            style={{ color: 'rgba(139,92,246,0.85)' }}
          >
            <Share2 size={13} />
            Compartir catálogo
          </button>

          {showShare && (
            <div
              className="absolute bottom-full left-3 right-3 mb-2 rounded-xl p-3 space-y-2"
              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Compartir catálogo</p>
                <button onClick={() => setShowShare(false)} className="text-muted hover:text-ink transition-colors">
                  <X size={13} />
                </button>
              </div>

              {/* URL */}
              <div
                className="text-[10px] text-muted px-2 py-1.5 rounded-lg truncate"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {catalogUrl}
              </div>

              {/* Buttons */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                style={{ background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)', color: copied ? '#34d399' : 'inherit', border: `1px solid ${copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)'}` }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Enlace copiado' : 'Copiar enlace'}
              </button>

              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}
              >
                <MessageCircle size={13} />
                Enviar por WhatsApp
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="sidebar-footer flex items-center justify-center gap-2 hover:text-danger transition-colors w-full"
        >
          <LogOut size={12} /> Cerrar sesión
        </button>
      </aside>
    </>
  )
}
