'use client'

import { Badge } from '@/components/ui/badge'
import type { EstadoPedido } from '@/lib/types'
import { ESTADO_LABEL } from '@/lib/types'

/**
 * Mapa único de color por estado: `badge` (clases Tailwind) y `chart`
 * (color para recharts). Fuente de verdad compartida entre EstadoBadge y
 * los charts del dashboard — no duplicar esta paleta. Los estados futuros
 * sin entrada caen al badge neutro / gris.
 */
export const ESTADO_COLOR: Partial<
  Record<EstadoPedido, { badge: string; chart: string }>
> = {
  en_construccion: {
    badge: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    chart: '#f97316',
  },
  solicitado: {
    badge: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    chart: '#3b82f6',
  },
  aprobado: {
    badge: 'bg-green-100 text-green-700 hover:bg-green-100',
    chart: '#16a34a',
  },
  rechazado: {
    badge: 'bg-red-100 text-red-700 hover:bg-red-100',
    chart: '#dc2626',
  },
}

/** Color de chart para estados sin entrada en el mapa. */
export const CHART_COLOR_FALLBACK = '#9ca3af'

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const color = ESTADO_COLOR[estado]
  if (!color) {
    return <Badge variant="secondary">{ESTADO_LABEL[estado] ?? estado}</Badge>
  }
  return <Badge className={color.badge}>{ESTADO_LABEL[estado]}</Badge>
}
