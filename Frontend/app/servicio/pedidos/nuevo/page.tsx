'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { SacOrderBuilder } from '@/components/servicio/sac-order-builder'

export default function ServicioNuevoPedidoPage() {
  return (
    <DashboardLayout
      title="Nuevo pedido"
      subtitle="Crea un pedido en nombre de un cliente"
      hasFixedBottomBar={false}
    >
      <RoleGuard rol="servicio">
        <SacOrderBuilder />
      </RoleGuard>
    </DashboardLayout>
  )
}
