'use client'

import * as React from 'react'
import { Boxes, Clock, Package, Wallet } from 'lucide-react'
import { usePortal } from '@/components/portal-provider'
import { totalesPedido } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Kpi {
  label: string
  value: string
  caption: string
  icon: React.ReactNode
  /** Borde izquierdo de la card. */
  borderColor: string
  /** Fondo/texto del cuadro del icono. */
  iconBox: string
}

/** Tarjetas KPI del dashboard de Servicio, derivadas del store de pedidos. */
export function PedidosKpis() {
  const { pedidos, getProducto } = usePortal()

  const kpis = React.useMemo<Kpi[]>(() => {
    const solicitados = pedidos.filter((p) => p.estado === 'solicitado')
    const enConstruccion = pedidos.filter(
      (p) => p.estado === 'en_construccion',
    )
    const valorEnCola = solicitados.reduce(
      (acc, p) => acc + totalesPedido(p, getProducto).total,
      0,
    )

    // Tiempo promedio de espera de los solicitados, en días desde fechaSolicitud.
    const esperas = solicitados
      .filter((p) => p.fechaSolicitud)
      .map(
        (p) =>
          (Date.now() - new Date(p.fechaSolicitud as string).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    const esperaPromedio =
      esperas.length > 0
        ? esperas.reduce((a, b) => a + b, 0) / esperas.length
        : null

    return [
      {
        label: 'Pedidos en cola',
        value: String(pedidos.length),
        caption: 'Todos los estados',
        icon: <Package className="size-5" />,
        borderColor: 'border-l-[#00359a]',
        iconBox: 'bg-[#00359a]/10 text-[#00359a]',
      },
      {
        label: 'Pendientes de aprobación',
        value: String(solicitados.length),
        caption:
          esperaPromedio !== null
            ? `Espera prom. ${esperaPromedio.toFixed(1)} días`
            : 'Sin pedidos en espera',
        icon: <Clock className="size-5" />,
        borderColor: 'border-l-[#ff6600]',
        iconBox: 'bg-[#ff6600]/10 text-[#ff6600]',
      },
      {
        label: 'Valor total en cola',
        value: formatCOP(valorEnCola),
        caption: `${solicitados.length} pedidos solicitados`,
        icon: <Wallet className="size-5" />,
        borderColor: 'border-l-green-600',
        iconBox: 'bg-green-600/10 text-green-600',
      },
      {
        label: 'En construcción',
        value: String(enConstruccion.length),
        caption: 'Borradores de clientes',
        icon: <Boxes className="size-5" />,
        borderColor: 'border-l-gray-400',
        iconBox: 'bg-gray-400/10 text-gray-500',
      },
    ]
  }, [pedidos, getProducto])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            'flex-row items-center justify-between gap-3 border-l-4 border-r-0 border-t-0 border-b-0 p-4',
            kpi.borderColor,
          )}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </span>
            <span className="truncate text-2xl font-bold tabular-nums text-foreground">
              {kpi.value}
            </span>
            <span className="text-xs text-muted-foreground">{kpi.caption}</span>
          </div>
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              kpi.iconBox,
            )}
          >
            {kpi.icon}
          </div>
        </Card>
      ))}
    </div>
  )
}
