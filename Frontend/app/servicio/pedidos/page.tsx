'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { ListadoPedidos } from '@/components/pedidos/listado-pedidos'

export default function ServicioPedidosPage() {
  return (
    <DashboardLayout
      title="Pedidos de ventas"
      subtitle="Gestión de la cola de pedidos"
    >
      <RoleGuard rol="servicio">
        <ListadoPedidos
          modo="gestion"
          basePath="/servicio/pedidos"
          estadoInicial="solicitado"
        />
      </RoleGuard>
    </DashboardLayout>
  )
}
