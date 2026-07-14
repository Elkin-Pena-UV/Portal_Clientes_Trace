'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  SquareStack,
  Calendar,
  CreditCard,
  FileText,
  Package,
  MapPin,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rol } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  group: string
  /** Roles que ven este item en la navegación. */
  roles: Rol[]
}

const sidebarItems: SidebarItem[] = [
  {
    group: 'PRINCIPAL',
    label: 'Inicio',
    href: '/',
    icon: <Home className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'PEDIDOS',
    label: 'Crear orden',
    href: '/crear-orden',
    icon: <Plus className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'PEDIDOS',
    label: 'Mis pedidos',
    href: '/mis-pedidos',
    icon: <SquareStack className="size-5" />,
    badge: 3,
    roles: ['cliente'],
  },
  {
    group: 'PEDIDOS',
    label: 'Programación',
    href: '/programacion',
    icon: <Calendar className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'CARTERA',
    label: 'Pagos',
    href: '/pagos',
    icon: <CreditCard className="size-5" />,
    badge: 2,
    roles: ['cliente'],
  },
  {
    group: 'CARTERA',
    label: 'Documentos',
    href: '/documentos',
    icon: <FileText className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'CATÁLOGO',
    label: 'Producto',
    href: '/producto',
    icon: <Package className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'CATÁLOGO',
    label: 'Sedes',
    href: '/sedes',
    icon: <MapPin className="size-5" />,
    roles: ['cliente'],
  },
  {
    group: 'GESTIÓN',
    label: 'Dashboard',
    href: '/servicio',
    icon: <LayoutDashboard className="size-5" />,
    roles: ['servicio'],
  },
  {
    group: 'GESTIÓN',
    label: 'Pedidos de ventas',
    href: '/servicio/pedidos',
    icon: <ClipboardList className="size-5" />,
    roles: ['servicio'],
  },
]

/** Agrupa los items visibles para un rol, preservando el orden de los grupos. */
function agruparItems(rol: Rol): Record<string, SidebarItem[]> {
  const grouped: Record<string, SidebarItem[]> = {}
  sidebarItems
    .filter((item) => item.roles.includes(rol))
    .forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = []
      grouped[item.group].push(item)
    })
  return grouped
}

/**
 * Devuelve el href del item que debe marcarse activo: el match más específico.
 * Evita que rutas índice (p.ej. /servicio) se activen en sus hijos (/servicio/pedidos).
 */
function getActiveHref(pathname: string, items: SidebarItem[]): string | null {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  if (matches.length === 0) return null
  return matches.reduce((a, b) => (b.href.length > a.href.length ? b : a)).href
}

/** Switcher temporal de rol, solo para desarrollo (no es auth real). */
function RolSwitcher() {
  const { rol, setRol } = usePortal()
  return (
    <select
      value={rol}
      onChange={(e) => setRol(e.target.value as Rol)}
      title="Cambiar rol (solo desarrollo)"
      className="mt-2 w-full rounded-md border border-dashed border-gray-300 bg-white px-2 py-1 text-xs text-gray-600"
    >
      <option value="cliente">Rol: Cliente</option>
      <option value="servicio">Rol: Servicio</option>
      <option value="admin">Rol: Admin</option>
    </select>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { rol } = usePortal()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)

  // Load persisted collapsed state after hydration
  React.useEffect(() => {
    setIsHydrated(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) {
      setIsCollapsed(JSON.parse(stored))
    }
  }, [])

  const handleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  const groups = React.useMemo(() => agruparItems(rol), [rol])
  const activeHref = getActiveHref(pathname, sidebarItems)

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-56'
  
  // For desktop: use the normal isCollapsed state
  const desktopContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 p-4">
        {!isCollapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-[#ff6600] text-white">
                <span className="text-xs font-bold">SM</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-[#ff6600]">
                  San Marcos
                </span>
                <span className="text-[10px] text-gray-500">
                  Portal de clientes
                </span>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleCollapse}
          className={cn(
            'rounded-md p-1 hover:bg-gray-100',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? (
            <Menu className="size-4 text-gray-600" />
          ) : (
            <ChevronLeft className="size-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-6">
            {!isCollapsed && (
              <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </div>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.href === activeHref

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#fff4ee] text-[#ff6600]'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md bg-[#ff6600]" />
                    )}
                    <div className={cn(isActive && 'pl-1')}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="flex items-center justify-center rounded-full bg-[#ff6600] w-5 h-5 text-white text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-1 right-1 flex items-center justify-center rounded-full bg-[#ff6600] w-3 h-3" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        {!isCollapsed && (
          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#00359a] text-white text-xs font-bold">
                M
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-gray-900">
                  María Restrepo
                </span>
                <span className="text-xs text-gray-500">
                  Compras · Constructora
                </span>
              </div>
            </div>
            <button className="rounded p-1 hover:bg-gray-200" title="Logout">
              <LogOut className="size-4 text-gray-600" />
            </button>
          </div>
        )}
        {!isCollapsed && <RolSwitcher />}
        {isCollapsed && (
          <button className="w-full rounded p-2 hover:bg-gray-100">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#00359a] text-white text-xs font-bold mx-auto">
              M
            </div>
          </button>
        )}
      </div>
    </>
  )

  // For mobile: always expanded (isCollapsed = false) regardless of desktop state
  const mobileContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-[#ff6600] text-white">
              <span className="text-xs font-bold">SM</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-[#ff6600]">
                San Marcos
              </span>
              <span className="text-[10px] text-gray-500">
                Portal de clientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group}
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.href === activeHref

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#fff4ee] text-[#ff6600]'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md bg-[#ff6600]" />
                    )}
                    <div className={cn(isActive && 'pl-1')}>
                      {item.icon}
                    </div>
                    <div className="flex items-center justify-between flex-1">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="flex items-center justify-center rounded-full bg-[#ff6600] w-5 h-5 text-white text-xs font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#00359a] text-white text-xs font-bold">
              M
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-900">
                María Restrepo
              </span>
              <span className="text-xs text-gray-500">
                Compras · Constructora
              </span>
            </div>
          </div>
          <button className="rounded p-1 hover:bg-gray-200" title="Logout">
            <LogOut className="size-4 text-gray-600" />
          </button>
        </div>
        <RolSwitcher />
      </div>
    </>
  )

  // Return only desktop sidebar for desktop layout + content wrapper for mobile (used by DashboardLayout)
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
          sidebarWidth
        )}
      >
        {desktopContent}
      </aside>

      {/* Desktop spacing helper */}
      <div className={cn('hidden md:block', isCollapsed ? 'md:w-16' : 'md:w-56')} />
    </>
  )
}

// Export mobile content component for use in DashboardLayout header
interface SidebarMobileContentProps {
  onClose?: () => void
}

export function SidebarMobileContent({ onClose = () => {} }: SidebarMobileContentProps) {
  const pathname = usePathname()
  const { rol } = usePortal()

  const groups = React.useMemo(() => agruparItems(rol), [rol])
  const activeHref = getActiveHref(pathname, sidebarItems)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-[#ff6600] text-white">
              <span className="text-xs font-bold">SM</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-[#ff6600]">
                San Marcos
              </span>
              <span className="text-[10px] text-gray-500">
                Portal de clientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group} className="mb-6">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group}
            </div>
            <div className="space-y-1">
              {groupItems.map((item) => {
                const isActive = item.href === activeHref

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#fff4ee] text-[#ff6600]'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md bg-[#ff6600]" />
                    )}
                    <div className={cn(isActive && 'pl-1')}>
                      {item.icon}
                    </div>
                    <div className="flex items-center justify-between flex-1">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="flex items-center justify-center rounded-full bg-[#ff6600] w-5 h-5 text-white text-xs font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#00359a] text-white text-xs font-bold">
              M
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-900">
                María Restrepo
              </span>
              <span className="text-xs text-gray-500">
                Compras · Constructora
              </span>
            </div>
          </div>
          <button className="rounded p-1 hover:bg-gray-200" title="Logout">
            <LogOut className="size-4 text-gray-600" />
          </button>
        </div>
        <RolSwitcher />
      </div>
    </>
  )
}
