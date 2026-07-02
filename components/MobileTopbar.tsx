'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'

export default function MobileTopbar() {
  const { toggle } = useSidebar()
  return (
    <div className="sidebar-root md:hidden fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-10 gap-3">
      <button
        onClick={toggle}
        className="p-1.5 -ml-1 rounded transition-colors"
        style={{ color: 'rgba(255,255,255,0.55)' }}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="gradient-btn-icon">V</div>
        <span className="sidebar-logo-text">VANTRA</span>
      </div>
    </div>
  )
}
