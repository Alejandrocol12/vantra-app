import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileTopbar from '@/components/MobileTopbar'
import { SidebarProvider } from '@/components/SidebarContext'

export const metadata: Metadata = {
  title: 'VANTRA | Control comercial',
  description: 'Sistema de inventario y registro de ventas para vaper',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'VANTRA',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#07070f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 md:pl-[220px]">
              <MobileTopbar />
              <div className="p-4 md:p-6 max-w-[1400px] pb-20 md:pb-6 pt-[60px] md:pt-6">
                {children}
              </div>
            </main>
          </div>
          <BottomNav />
        </SidebarProvider>
      </body>
    </html>
  )
}
