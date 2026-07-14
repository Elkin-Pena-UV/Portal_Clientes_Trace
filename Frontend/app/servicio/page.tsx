'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'

export default function ServicioDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard de pedidos"
      subtitle="Estado general de la cola de pedidos"
    >
      <RoleGuard rol="servicio">
        <p className="text-sm text-muted-foreground">
          Dashboard de pedidos (en construcción).
        </p>
      </RoleGuard>
    </DashboardLayout>
  )
}
