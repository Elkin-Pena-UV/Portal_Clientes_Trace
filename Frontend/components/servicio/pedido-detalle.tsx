'use client'

import * as React from 'react'
import Image from 'next/image'
import { CheckCircle2, Lock, MapPin, Save, Store, Truck } from 'lucide-react'
import { toast } from 'sonner'
import type {
  DatosEntrega,
  DatosRetira,
  ItemPedido,
  Pedido,
} from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { calcularLinea, totalesPedido } from '@/lib/order-utils'
import { formatCOP, formatFecha, formatPct } from '@/lib/format'
import { EstadoBadge } from '@/components/pedidos/estado-badge'
import { DatePicker } from '@/components/ordenes/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * SUPOSICIÓN A CONFIRMAR (default pragmático de Fase 2):
 * tras "Solicitado" son editables los datos de contacto, las observaciones
 * y la fecha de entrega de cada item; NO son editables productos, cantidades
 * ni precios. Una vez "Aprobado" se bloquea toda edición.
 */
interface Borrador {
  datosEntrega: DatosEntrega
  datosRetira: DatosRetira
  items: ItemPedido[]
}

function borradorDesde(pedido: Pedido): Borrador {
  return {
    datosEntrega: { ...pedido.datosEntrega },
    datosRetira: { ...pedido.datosRetira },
    items: pedido.items.map((i) => ({ ...i })),
  }
}

export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  const { getProducto, getSede, actualizarPedido, aprobarPedido } = usePortal()
  const [borrador, setBorrador] = React.useState<Borrador>(() =>
    borradorDesde(pedido),
  )

  const editable = pedido.estado !== 'aprobado'
  const entregar = pedido.metodoDespacho === 'entregar'
  const sede = getSede(
    entregar ? pedido.datosEntrega.sedeId : pedido.datosRetira.sedeId,
  )
  const totales = totalesPedido(pedido, getProducto)
  const dirty =
    JSON.stringify(borrador) !== JSON.stringify(borradorDesde(pedido))

  const setEntrega = (patch: Partial<DatosEntrega>) =>
    setBorrador((b) => ({ ...b, datosEntrega: { ...b.datosEntrega, ...patch } }))
  const setRetira = (patch: Partial<DatosRetira>) =>
    setBorrador((b) => ({ ...b, datosRetira: { ...b.datosRetira, ...patch } }))
  const setFechaItem = (productoId: string, fechaEntrega: string) =>
    setBorrador((b) => ({
      ...b,
      items: b.items.map((i) =>
        i.productoId === productoId ? { ...i, fechaEntrega } : i,
      ),
    }))

  const guardar = () => {
    actualizarPedido(pedido.id, borrador)
    toast.success('Cambios guardados')
  }

  const aprobar = () => {
    aprobarPedido(pedido.id)
    toast.success(`Pedido ${pedido.numero} aprobado`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <Card className="gap-3 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-lg font-bold text-[#00359a]">{pedido.numero}</h2>
          <EstadoBadge estado={pedido.estado} />
          <Badge variant={entregar ? 'default' : 'secondary'} className="gap-1">
            {entregar ? <Truck className="size-3" /> : <Store className="size-3" />}
            {entregar ? 'Entregar' : 'Retira'}
          </Badge>
          {!editable && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Aprobado: edición bloqueada
            </span>
          )}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <InfoItem label="Cliente" value={pedido.clienteNombre} />
          <InfoItem
            label="Fecha de creación"
            value={formatFecha(pedido.fechaCreacion.slice(0, 10))}
          />
          <InfoItem
            label="Sede"
            value={sede ? `${sede.nombre} · ${sede.ciudad}` : '—'}
            icon={<MapPin className="size-3.5" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {pedido.estado === 'solicitado' && (
            <Button onClick={aprobar} className="gap-2">
              <CheckCircle2 className="size-4" />
              Aprobar pedido
            </Button>
          )}
          {editable && (
            <Button
              variant="outline"
              onClick={guardar}
              disabled={!dirty}
              className="gap-2"
            >
              <Save className="size-4" />
              Guardar cambios
            </Button>
          )}
        </div>
      </Card>

      {/* Datos de despacho */}
      <Card className="gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-brand">
            {entregar ? 'Datos de entrega' : 'Datos de retiro'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Contacto y observaciones editables mientras el pedido no esté
            aprobado (suposición de Fase 2 a confirmar).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            label="Orden de compra"
            value={
              entregar
                ? pedido.datosEntrega.ordenCompra
                : pedido.datosRetira.ordenCompra
            }
          />
          {entregar ? (
            <InfoItem
              label="Estiba / Descarga"
              value={`${pedido.datosEntrega.necesitaEstiba ? 'Sí' : 'No'} / ${
                pedido.datosEntrega.necesitaDescarga ? 'Sí' : 'No'
              }`}
            />
          ) : (
            <InfoItem
              label="Estiba"
              value={pedido.datosRetira.necesitaEstiba ? 'Sí' : 'No'}
            />
          )}
        </div>

        {entregar ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Recibe">
              <Input
                value={borrador.datosEntrega.nombreRecibe}
                onChange={(e) => setEntrega({ nombreRecibe: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Celular">
              <Input
                value={borrador.datosEntrega.celular}
                onChange={(e) => setEntrega({ celular: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Correo">
              <Input
                type="email"
                value={borrador.datosEntrega.correo}
                onChange={(e) => setEntrega({ correo: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Observaciones" className="sm:col-span-2">
              <Textarea
                value={borrador.datosEntrega.observaciones}
                onChange={(e) => setEntrega({ observaciones: e.target.value })}
                disabled={!editable}
                rows={2}
              />
            </Campo>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Conductor">
              <Input
                value={borrador.datosRetira.nombreConductor}
                onChange={(e) => setRetira({ nombreConductor: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Cédula">
              <Input
                value={borrador.datosRetira.cedula}
                onChange={(e) => setRetira({ cedula: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Placa">
              <Input
                value={borrador.datosRetira.placa}
                onChange={(e) =>
                  setRetira({ placa: e.target.value.toUpperCase() })
                }
                disabled={!editable}
              />
            </Campo>
            <Campo label="Celular">
              <Input
                value={borrador.datosRetira.celular}
                onChange={(e) => setRetira({ celular: e.target.value })}
                disabled={!editable}
              />
            </Campo>
            <Campo label="Observaciones" className="sm:col-span-2">
              <Textarea
                value={borrador.datosRetira.observaciones}
                onChange={(e) => setRetira({ observaciones: e.target.value })}
                disabled={!editable}
                rows={2}
              />
            </Campo>
          </div>
        )}
      </Card>

      {/* Productos */}
      <Card className="gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-brand">Productos</h3>
          <p className="text-xs text-muted-foreground">
            Productos, cantidades y precios no son editables desde Servicio;
            solo la fecha de entrega de cada línea.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.items.map((item) => {
                const prod = getProducto(item.productoId)
                if (!prod) return null
                const linea = calcularLinea(prod, item.cantidad)
                const fechaBorrador =
                  borrador.items.find((i) => i.productoId === item.productoId)
                    ?.fechaEntrega ?? null
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
                            {prod.codigo} · {prod.unidad}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {editable ? (
                        <DatePicker
                          value={fechaBorrador}
                          onChange={(iso) =>
                            setFechaItem(item.productoId, iso)
                          }
                          compact
                          placeholder="Sin fecha"
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          {item.fechaEntrega
                            ? formatFecha(item.fechaEntrega)
                            : '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCOP(prod.precio)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.cantidad}
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
              {pedido.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Este pedido aún no tiene productos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <TotalRow label="Neto" value={totales.neto} />
          <TotalRow label={`IVA (${formatPct(0.19)})`} value={totales.iva} />
          <Separator className="my-1 w-48" />
          <div className="flex w-48 items-center justify-between">
            <span className="font-semibold">Total pedido</span>
            <span className="font-bold tabular-nums text-primary">
              {formatCOP(totales.total)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1 font-medium text-pretty">
        {icon}
        {value || '—'}
      </span>
    </div>
  )
}

function Campo({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex w-48 items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatCOP(value)}</span>
    </div>
  )
}
