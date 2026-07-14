import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { PortalProvider } from '@/components/portal-provider'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Portal de Clientes | Materiales de Construcción',
  description:
    'Crea y gestiona tus pedidos de cemento en saco y a granel de forma rápida y clara.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#c2410c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased overflow-x-hidden">
        <PortalProvider>
          <div className="flex h-screen flex-col overflow-hidden md:flex-row">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto md:ml-0">{children}</main>
          </div>
          <Toaster richColors position="top-center" />
        </PortalProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
