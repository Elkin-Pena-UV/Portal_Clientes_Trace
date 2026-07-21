'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardList, Loader2, Send } from 'lucide-react'
import type { Pedido } from '@/lib/types'
import { asesorServicioMock } from '@/lib/mock-data'
import {
  nuevoPedidoParaCliente,
  pedidoCompleto,
  totalUnidades,
  totalesPedido,
} from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import { usePortal } from '@/components/portal-provider'
import { NuevoPedidoCabecera } from '@/components/servicio/nuevo-pedido-cabecera'
import { PedidoCard } from '@/components/ordenes/pedido-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * Constructor de pedidos para Servicio al Cliente (SAC): crea un pedido en
 * nombre de un cliente. NO reutiliza `OrderBuilder` del cliente porque aquel
 * está cableado a `clienteActualMock` y su envío es simulado. Aquí el pedido
 * se inserta de verdad en el store vía `crearPedido` (D1: nace 'solicitado').
 */
export function SacOrderBuilder() {
  const { getProducto, crearPedido, getCliente } = usePortal()
  const router = useRouter()

  const [clienteId, setClienteId] = React.useState<string | null>(null)
  const [pedido, setPedido] = React.useState<Pedido | null>(null)
  const [showErrors, setShowErrors] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [confirmarSalida, setConfirmarSalida] = React.useState(false)

  // Hay borrador sin guardar mientras se eligió cliente y no se envió aún.
  const dirty = pedido !== null && !submitting

  function seleccionarCliente(id: string) {
    const cliente = getCliente(id)
    if (!cliente) return
    setClienteId(id)
    // Regenera el pedido con las condiciones comerciales del cliente elegido.
    setPedido(nuevoPedidoParaCliente(cliente, asesorServicioMock.email))
    setShowErrors(false)
  }

  function cambiarPlazo(codigo: string) {
    setPedido((p) => (p ? { ...p, plazoCodigo: codigo } : p))
  }

  const totales = pedido
    ? totalesPedido(pedido, getProducto)
    : { neto: 0, iva: 0, total: 0 }
  const unidades = pedido ? totalUnidades(pedido) : 0

  function guardar() {
    if (!clienteId || !pedido) {
      setShowErrors(true)
      toast.error('Selecciona un cliente para crear el pedido.')
      return
    }
    if (!pedidoCompleto(pedido)) {
      setShowErrors(true)
      toast.error('Revisa los datos: el pedido está incompleto.')
      return
    }
    setSubmitting(true)
    // D1: nace 'solicitado' con consecutivo real y entra a la cola de aprobación.
    const id = crearPedido(pedido, { solicitar: true })
    toast.success('Pedido creado y enviado a la cola de aprobación.')
    router.push(`/servicio/pedidos/${id}`)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Retorno al listado; con borrador sin guardar pide confirmación. */}
      <Link
        href="/servicio/pedidos"
        onClick={(e) => {
          if (dirty) {
            e.preventDefault()
            setConfirmarSalida(true)
          }
        }}
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Pedidos de ventas
      </Link>

      <div className="flex flex-col gap-4">
        <NuevoPedidoCabecera
          clienteId={clienteId}
          onSelectCliente={seleccionarCliente}
          plazoCodigo={pedido?.plazoCodigo ?? ''}
          onChangePlazo={cambiarPlazo}
          showErrors={showErrors}
        />

        {pedido ? (
          <PedidoCard
            pedido={pedido}
            index={0}
            isOpen
            onToggle={() => {}}
            onChange={setPedido}
            onRemove={null}
            showErrors={showErrors}
          />
        ) : (
          <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Selecciona un cliente arriba para empezar a armar el pedido.
          </p>
        )}
      </div>

      {/* Barra sticky con resumen + guardar (mismo patrón que "Crear orden"). */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 md:gap-4 md:py-4">
          <div className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
            <ClipboardList className="size-4 shrink-0 text-brand" />
            <span className="truncate text-muted-foreground">
              {pedido?.items.length ?? 0} prod. · {unidades} und.
            </span>
          </div>

          <div className="hidden text-sm md:flex md:items-center md:gap-x-4">
            <span className="text-muted-foreground">
              Neto{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatCOP(totales.neto)}
              </span>
            </span>
            <span className="text-muted-foreground">
              IVA{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatCOP(totales.iva)}
              </span>
            </span>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
            <div className="flex flex-col text-right leading-tight">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total general
              </span>
              <span className="text-base font-bold tabular-nums text-[#ff6600] md:text-lg">
                {formatCOP(totales.total)}
              </span>
            </div>
            <Button
              onClick={guardar}
              disabled={submitting}
              className="shrink-0 gap-2"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span className="hidden md:inline">Crear pedido</span>
              <span className="md:hidden">Crear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmación al salir con borrador sin guardar. */}
      <AlertDialog open={confirmarSalida} onOpenChange={setConfirmarSalida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tienes un pedido sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora se perderá el pedido que estás creando.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              onClick={() => router.push('/servicio/pedidos')}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
