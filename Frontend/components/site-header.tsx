'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSpreadsheet, Home, HardHat, MapPin, PackagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/', label: 'Crear pedido', icon: PackagePlus },
  { href: '/cargar-plantilla', label: 'Cargar Excel', icon: FileSpreadsheet },
  { href: '/sedes', label: 'Sedes', icon: MapPin },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <HardHat className="size-5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">
              CementoYa
            </span>
            <span className="text-xs text-muted-foreground">
              Portal de clientes
            </span>
          </div>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand text-brand-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
