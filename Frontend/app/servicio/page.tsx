'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { PedidosKpis } from '@/components/servicio/pedidos-kpis'
import { StatusPieChart } from '@/components/servicio/status-pie-chart'
import { CreditoBarChart } from '@/components/servicio/credito-bar-chart'
import { PedidosAtencion } from '@/components/servicio/pedidos-atencion'

export default function ServicioDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Panorama operativo de la cola de pedidos"
    >
      <RoleGuard rol="servicio">
        <div className="flex flex-col gap-6">
          <PedidosKpis />
          <div className="grid gap-4 lg:grid-cols-2">
            <StatusPieChart />
            <CreditoBarChart />
          </div>
          <PedidosAtencion />
        </div>
      </RoleGuard>
    </DashboardLayout>
  )
}
