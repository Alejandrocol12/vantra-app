'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileTopbar from './MobileTopbar'

const NO_SHELL = ['/login', '/catalogo']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = NO_SHELL.some(p => pathname.startsWith(p))

  if (bare) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 md:pl-[220px]">
        <MobileTopbar />
        <div className="p-4 md:p-6 max-w-[1400px] pb-20 md:pb-6 pt-[60px] md:pt-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
