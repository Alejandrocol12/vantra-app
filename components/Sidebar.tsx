'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, ArrowLeftRight, BarChart3, Bell, Users, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const { open, close } = useSidebar()
  const [alertCount, setAlertCount] = useState(0)

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

        <div className="sidebar-footer">VANTRA v2.0 · Next.js + SQLite</div>
      </aside>
    </>
  )
}
