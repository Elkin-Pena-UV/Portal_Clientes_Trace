'use client'

import { Badge } from '@/components/ui/badge'
import type { EstadoPedido } from '@/lib/types'
import { ESTADO_LABEL } from '@/lib/types'

/**
 * Color por estado. Los estados futuros sin entrada aquí caen al badge
 * neutro; basta con agregar su clase cuando exista la vista que los use.
 */
const ESTADO_BADGE_CLASS: Partial<Record<EstadoPedido, string>> = {
  en_construccion: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  solicitado: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  aprobado: 'bg-green-100 text-green-700 hover:bg-green-100',
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const colorClass = ESTADO_BADGE_CLASS[estado]
  if (!colorClass) {
    return <Badge variant="secondary">{ESTADO_LABEL[estado] ?? estado}</Badge>
  }
  return <Badge className={colorClass}>{ESTADO_LABEL[estado]}</Badge>
}
