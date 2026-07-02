import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'
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
          <AppShell>{children}</AppShell>
        </SidebarProvider>
      </body>
    </html>
  )
}
