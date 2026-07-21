import type { EstadoCredito } from '@/lib/types'
import { ESTADO_CREDITO_LABEL } from '@/lib/types'

/**
 * Badge sutil del estado de crédito. Deliberadamente más tenue que
 * `EstadoBadge` (el estado del pedido es el protagonista en el listado).
 * Reutilizable: listado de pedidos y cabecera de creación SAC.
 */
export function EstadoCreditoBadge({
  estadoCredito,
}: {
  estadoCredito: EstadoCredito
}) {
  const clase =
    estadoCredito === 'aprobado'
      ? 'bg-green-50 text-green-600'
      : 'bg-gray-100 text-gray-500'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}
    >
      {ESTADO_CREDITO_LABEL[estadoCredito]}
    </span>
  )
}
