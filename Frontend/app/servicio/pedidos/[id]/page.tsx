'use client'

import { use } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'

export default function ServicioPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <DashboardLayout title="Detalle del pedido">
      <RoleGuard rol="servicio">
        <p className="text-sm text-muted-foreground">
          Detalle del pedido {id} (en construcción).
        </p>
      </RoleGuard>
    </DashboardLayout>
  )
}
