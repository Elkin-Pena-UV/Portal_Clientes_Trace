'use client'

import { use } from 'react'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { PedidoDetalle } from '@/components/servicio/pedido-detalle'
import { usePortal } from '@/components/portal-provider'

export default function ServicioPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getPedido } = usePortal()
  const pedido = getPedido(id)

  return (
    <DashboardLayout
      title={pedido ? `Pedido ${pedido.numero}` : 'Detalle del pedido'}
      subtitle={pedido ? pedido.clienteNombre : undefined}
    >
      <RoleGuard rol="servicio">
        {pedido ? (
          <PedidoDetalle pedido={pedido} />
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <SearchX className="size-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Pedido no encontrado</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No existe un pedido con id &quot;{id}&quot; en el store.
            </p>
            <Link
              href="/servicio/pedidos"
              className="text-sm font-medium text-[#ff6600] hover:underline"
            >
              Volver al listado
            </Link>
          </div>
        )}
      </RoleGuard>
    </DashboardLayout>
  )
}
