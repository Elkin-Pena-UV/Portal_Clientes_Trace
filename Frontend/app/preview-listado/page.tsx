'use client'

/**
 * HARNESS TEMPORAL — SOLO DESARROLLO.
 *
 * Ruta desechable para eyeballear <ListadoPedidos /> (filtros, modos y
 * responsive) mientras no existen las páginas reales de Servicio/Admin.
 * BORRAR esta carpeta al montar esas páginas en Fase 2/3.
 */

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ListadoPedidos } from '@/components/pedidos/listado-pedidos'

export default function PreviewListadoPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-dashed border-orange-400 bg-orange-50 p-3 text-sm text-orange-800">
          Harness temporal de desarrollo para <code>ListadoPedidos</code> (Fase
          2 revisada: columnas de la pantalla real de Ventas). Se elimina al
          crear las páginas reales de Servicio/Admin.
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            modo=&quot;gestion&quot; · estadoInicial=&quot;solicitado&quot;
          </h2>
          <ListadoPedidos
            modo="gestion"
            basePath="#"
            estadoInicial="solicitado"
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            modo=&quot;supervision&quot; · sin filtro inicial (todas las
            columnas, borradores con acción Editar)
          </h2>
          <ListadoPedidos modo="supervision" basePath="#" />
        </section>
      </div>
    </DashboardLayout>
  )
}
