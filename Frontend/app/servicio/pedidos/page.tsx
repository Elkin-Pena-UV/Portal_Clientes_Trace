'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RoleGuard } from '@/components/role-guard'
import { ListadoPedidos } from '@/components/pedidos/listado-pedidos'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ServicioPedidosPage() {
  return (
    <DashboardLayout
      title="Pedidos de ventas"
      subtitle="Gestión de la cola de pedidos"
      ctaButton={
        <Link
          href="/servicio/pedidos/nuevo"
          className={cn(buttonVariants(), 'gap-2')}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo pedido</span>
        </Link>
      }
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
