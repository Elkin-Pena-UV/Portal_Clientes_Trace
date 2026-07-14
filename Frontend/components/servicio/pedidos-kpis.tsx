'use client'

import { Boxes, CheckCircle2, Clock, Package } from 'lucide-react'
import type { EstadoPedido } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { usePortal } from '@/components/portal-provider'

interface Kpi {
  icon: React.ReactNode
  title: string
  value: number
  subtitle: string
  borderColor: string
  valueColor?: string
}

/** Tarjetas KPI del dashboard de Servicio, derivadas del store de pedidos. */
export function PedidosKpis() {
  const { pedidos } = usePortal()

  const porEstado = (estado: EstadoPedido) =>
    pedidos.filter((p) => p.estado === estado).length

  const kpis: Kpi[] = [
    {
      icon: <Clock className="size-6 text-[#ff6600]" />,
      title: 'En cola',
      value: porEstado('solicitado'),
      subtitle: 'Solicitados por aprobar',
      borderColor: 'border-l-[#ff6600]',
      valueColor: 'text-[#ff6600]',
    },
    {
      icon: <CheckCircle2 className="size-6 text-green-600" />,
      title: 'Aprobados',
      value: porEstado('aprobado'),
      subtitle: 'Total histórico',
      borderColor: 'border-l-green-600',
    },
    {
      icon: <Boxes className="size-6 text-[#00359a]" />,
      title: 'En construcción',
      value: porEstado('en_construccion'),
      subtitle: 'Borradores de clientes',
      borderColor: 'border-l-[#00359a]',
    },
    {
      icon: <Package className="size-6 text-[#00359a]" />,
      title: 'Total pedidos',
      value: pedidos.length,
      subtitle: 'Todos los estados',
      borderColor: 'border-l-[#00359a]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.title}
          className={cn(
            'border-l-4 border-r-0 border-t-0 border-b-0',
            kpi.borderColor,
          )}
        >
          <CardContent className="pt-6 pb-4">
            <div className="mb-4 flex items-start justify-between">
              <div>{kpi.icon}</div>
              <span className="text-xs font-medium text-gray-500">
                {kpi.title}
              </span>
            </div>
            <div
              className={cn(
                'mb-1 text-2xl font-bold tabular-nums',
                kpi.valueColor ?? 'text-gray-900',
              )}
            >
              {kpi.value}
            </div>
            <p className="text-sm text-gray-600">{kpi.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
