'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, BarChart3, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/',          label: 'Inicio',    icon: LayoutDashboard },
  { href: '/pos',       label: 'Venta',     icon: ShoppingBag },
  { href: '/inventario', label: 'Productos', icon: Package },
  { href: '/ventas',    label: 'Ventas',    icon: BarChart3 },
  { href: '/alertas',   label: 'Alertas',   icon: Bell },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-[rgba(0,0,0,0.1)] z-20 flex md:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex flex-col items-center py-2 gap-1 text-[10px] transition-colors',
            pathname === href ? 'text-brand' : 'text-muted'
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
