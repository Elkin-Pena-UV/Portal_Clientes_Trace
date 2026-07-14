'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'

export default function ServicioPedidosPage() {
  return (
    <DashboardLayout
      title="Pedidos de ventas"
      subtitle="Gestión de la cola de pedidos"
    >
      <RoleGuard rol="servicio">
        <p className="text-sm text-muted-foreground">
          Listado de pedidos (en construcción).
        </p>
      </RoleGuard>
    </DashboardLayout>
  )
}
