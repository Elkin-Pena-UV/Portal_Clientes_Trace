'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { PedidosKpis } from '@/components/servicio/pedidos-kpis'
import { ListadoPedidos } from '@/components/pedidos/listado-pedidos'

export default function ServicioDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard de pedidos"
      subtitle="Estado general de la cola de pedidos"
    >
      <RoleGuard rol="servicio">
        <div className="flex flex-col gap-6">
          <PedidosKpis />
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground md:text-lg">
              Cola de pedidos
            </h2>
            <ListadoPedidos
              modo="gestion"
              basePath="/servicio/pedidos"
              estadoInicial="solicitado"
            />
          </section>
        </div>
      </RoleGuard>
    </DashboardLayout>
  )
}
