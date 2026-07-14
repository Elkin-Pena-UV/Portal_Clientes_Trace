'use client'

import Image from 'next/image'
import { Package, Truck, Store, Trash2, Pencil, MapPin } from 'lucide-react'
import type { PedidoImportado } from '@/lib/plantilla/constants'
import {
  calcularLinea,
  totalesPedido,
  totalesGlobales,
} from '@/lib/order-utils'
import { formatCOP, formatFecha, formatPct } from '@/lib/format'
import { usePortal } from '@/components/portal-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PedidosReviewProps {
  pedidos: PedidoImportado[]
  onEditar: () => void
  onEliminar: (pedidoId: string) => void
}

export function PedidosReview({
  pedidos,
  onEditar,
  onEliminar,
}: PedidosReviewProps) {
  const { getProducto, getSede } = usePortal()
  const totalGeneral = totalesGlobales(
    pedidos.map((p) => p.pedido),
    getProducto,
  )

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        defaultValue={pedidos.map((p) => p.pedido.id)}
        className="flex flex-col gap-3"
      >
        {pedidos.map((imp, index) => {
          const { pedido, origen } = imp
          const sede = getSede(
            pedido.metodoDespacho === 'entregar'
              ? pedido.datosEntrega.sedeId
              : pedido.datosRetira.sedeId,
          )
          const entregar = pedido.metodoDespacho === 'entregar'
          const contacto = entregar
            ? pedido.datosEntrega.nombreRecibe
            : pedido.datosRetira.nombreConductor
          const totales = totalesPedido(pedido, getProducto)

          return (
            <AccordionItem
              key={pedido.id}
              value={pedido.id}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="flex items-center gap-2 px-3 sm:px-4">
                <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-left">
                    <span className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                        <Package className="size-4" />
                      </span>
                      <span className="font-semibold">Pedido {index + 1}</span>
                    </span>
                    <Badge
                      variant={entregar ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {entregar ? (
                        <Truck className="size-3" />
                      ) : (
                        <Store className="size-3" />
                      )}
                      {entregar ? 'Entregar' : 'Retira'}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {sede?.nombre ?? 'Sede'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {origen}
                    </span>
                    <span className="ml-auto text-sm font-bold tabular-nums text-primary">
                      {formatCOP(totales.total)}
                    </span>
                  </div>
                </AccordionTrigger>
              </div>

              <AccordionContent className="px-3 pb-4 sm:px-4">
                <div className="flex flex-col gap-4">
                  {/* Datos de despacho */}
                  <div className="grid gap-3 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
                    <InfoItem
                      label={entregar ? 'Recibe' : 'Conductor'}
                      value={contacto}
                    />
                    <InfoItem
                      label="Celular"
                      value={
                        entregar
                          ? pedido.datosEntrega.celular
                          : pedido.datosRetira.celular
                      }
                    />
                    <InfoItem
                      label="Orden de compra"
                      value={
                        entregar
                          ? pedido.datosEntrega.ordenCompra
                          : pedido.datosRetira.ordenCompra
                      }
                    />
                    {entregar ? (
                      <>
                        <InfoItem
                          label="Correo"
                          value={pedido.datosEntrega.correo}
                        />
                        <InfoItem
                          label="Estiba / Descarga"
                          value={`${pedido.datosEntrega.necesitaEstiba ? 'Sí' : 'No'} / ${
                            pedido.datosEntrega.necesitaDescarga ? 'Sí' : 'No'
                          }`}
                        />
                        {pedido.datosEntrega.observaciones && (
                          <InfoItem
                            label="Observaciones"
                            value={pedido.datosEntrega.observaciones}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <InfoItem
                          label="Cédula"
                          value={pedido.datosRetira.cedula}
                        />
                        <InfoItem
                          label="Placa"
                          value={pedido.datosRetira.placa}
                        />
                        <InfoItem
                          label="Estiba"
                          value={pedido.datosRetira.necesitaEstiba ? 'Sí' : 'No'}
                        />
                        {pedido.datosRetira.observaciones && (
                          <InfoItem
                            label="Observaciones"
                            value={pedido.datosRetira.observaciones}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Sub-tabla de productos */}
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead className="text-right">Cant.</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead className="text-right">P. unit.</TableHead>
                          <TableHead className="text-right">Neto</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedido.items.map((item) => {
                          const prod = getProducto(item.productoId)
                          if (!prod) return null
                          const linea = calcularLinea(prod, item.cantidad)
                          return (
                            <TableRow key={item.productoId}>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <span className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                                    <Image
                                      src={prod.imagen || '/placeholder.svg'}
                                      alt={prod.nombre}
                                      fill
                                      sizes="36px"
                                      className="object-cover"
                                    />
                                  </span>
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-medium">
                                      {prod.nombre}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {prod.codigo}
                                    </span>
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {prod.unidad}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {item.cantidad}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {item.fechaEntrega
                                  ? formatFecha(item.fechaEntrega)
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCOP(prod.precio)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCOP(linea.neto)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {formatCOP(linea.iva)}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {formatCOP(linea.total)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totales del pedido */}
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <TotalRow label="Neto" value={totales.neto} />
                    <TotalRow
                      label={`IVA (${formatPct(0.19)})`}
                      value={totales.iva}
                    />
                    <Separator className="my-1 w-48" />
                    <div className="flex w-48 items-center justify-between">
                      <span className="font-semibold">Total pedido</span>
                      <span className="font-bold tabular-nums text-primary">
                        {formatCOP(totales.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onEditar}
                    >
                      <Pencil data-icon="inline-start" />
                      Editar en el portal
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEliminar(pedido.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 data-icon="inline-start" />
                      Eliminar pedido
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Total general */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-brand">
            Total general del lote
          </span>
          <div className="flex flex-col gap-1 text-sm sm:max-w-xs sm:self-end">
            <TotalRow label="Neto" value={totalGeneral.neto} />
            <TotalRow label={`IVA (${formatPct(0.19)})`} value={totalGeneral.iva} />
            <Separator className="my-1" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total general</span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatCOP(totalGeneral.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium text-pretty">{value || '—'}</span>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex w-48 items-center justify-between sm:w-full">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatCOP(value)}</span>
    </div>
  )
}
