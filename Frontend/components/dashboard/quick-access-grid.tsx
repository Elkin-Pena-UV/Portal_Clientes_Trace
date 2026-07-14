'use client'

import Link from 'next/link'
import {
  Plus,
  Package,
  Calendar,
  CreditCard,
  FileText,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

const quickAccessItems = [
  {
    id: 'crear',
    icon: Plus,
    title: 'Crear orden',
    subtitle: 'Nueva orden de compra',
    href: '/',
    iconColor: '#ff6600',
  },
  {
    id: 'pedidos',
    icon: Package,
    title: 'Mis pedidos',
    subtitle: 'Seguimiento e historial',
    href: '/',
    iconColor: '#00359a',
  },
  {
    id: 'prog',
    icon: Calendar,
    title: 'Programación',
    subtitle: 'Próximas entregas',
    href: '/',
    iconColor: '#00359a',
  },
  {
    id: 'pagos',
    icon: CreditCard,
    title: 'Pagos',
    subtitle: 'Cartera y PSE',
    href: '/',
    iconColor: '#ff6600',
  },
  {
    id: 'docs',
    icon: FileText,
    title: 'Documentos',
    subtitle: 'Facturas y remisiones',
    href: '/',
    iconColor: '#00359a',
  },
  {
    id: 'producto',
    icon: BookOpen,
    title: 'Producto',
    subtitle: 'Fichas técnicas',
    href: '/',
    iconColor: '#00359a',
  },
]

export function QuickAccessGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
      {quickAccessItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.id} href={item.href}>
            <Card className="group cursor-pointer border transition-all hover:border-[#ff6600] hover:shadow-md w-full min-w-0">
              <div className="flex items-start justify-between p-5 min-w-0">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${item.iconColor}15` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: item.iconColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#ff6600] ml-2" />
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
