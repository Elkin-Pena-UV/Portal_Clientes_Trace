'use client'

import * as React from 'react'
import Link from 'next/link'
import { Pencil, Search } from 'lucide-react'
import type { EstadoPedido, Pedido, Sede } from '@/lib/types'
import { ESTADO_CREDITO_LABEL, ESTADO_LABEL } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { totalUnidades, totalesPedido } from '@/lib/order-utils'
import { formatCOP, formatFecha } from '@/lib/format'
import { EstadoBadge } from '@/components/pedidos/estado-badge'
import { DatePicker } from '@/components/ordenes/date-picker'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ESTADOS = Object.keys(ESTADO_LABEL) as EstadoPedido[]

type FiltroEstado = EstadoPedido | 'todos'

interface ListadoPedidosProps {
  /** gestion = Servicio al Cliente, supervision = Admin (solo lectura). */
  modo: 'gestion' | 'supervision'
  /** El link de detalle de cada pedido es `${basePath}/${id}`. */
  basePath: string
  /** Filtro de estado con el que arranca el listado. */
  estadoInicial?: EstadoPedido
}

/** Sede del pedido según su método de despacho. */
function sedeDePedido(
  pedido: Pedido,
  getSede: (id: string) => Sede | undefined,
): Sede | undefined {
  const sedeId =
    pedido.metodoDespacho === 'retira'
      ? pedido.datosRetira.sedeId
      : pedido.datosEntrega.sedeId
  return sedeId ? getSede(sedeId) : undefined
}

export function ListadoPedidos({
  modo,
  basePath,
  estadoInicial,
}: ListadoPedidosProps) {
  const { pedidos, getProducto, getSede } = usePortal()
  const [estado, setEstado] = React.useState<FiltroEstado>(
    estadoInicial ?? 'todos',
  )
  const [clienteId, setClienteId] = React.useState<string>('todos')
  const [desde, setDesde] = React.useState<string | null>(null)
  const [hasta, setHasta] = React.useState<string | null>(null)

  const clientes = React.useMemo(() => {
    const porId = new Map<string, string>()
    pedidos.forEach((p) => porId.set(p.clienteId, p.clienteNombre))
    return Array.from(porId, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    )
  }, [pedidos])

  // `items` permite que el trigger del select muestre el label, no el value.
  const estadoItems = React.useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e] })),
    ],
    [],
  )
  const clienteItems = React.useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...clientes.map((c) => ({ value: c.id, label: c.nombre })),
    ],
    [clientes],
  )

  const filtrados = React.useMemo(() => {
    return pedidos
      .filter((p) => {
        if (estado !== 'todos' && p.estado !== estado) return false
        if (clienteId !== 'todos' && p.clienteId !== clienteId) return false
        const fecha = p.fechaCreacion.slice(0, 10)
        if (desde && fecha < desde) return false
        if (hasta && fecha > hasta) return false
        return true
      })
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  }, [pedidos, estado, clienteId, desde, hasta])

  const hayFiltros =
    estado !== 'todos' || clienteId !== 'todos' || desde !== null || hasta !== null

  const limpiarFiltros = () => {
    setEstado('todos')
    setClienteId('todos')
    setDesde(null)
    setHasta(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <FiltroCampo label="Estado">
          <Select
            items={estadoItems}
            value={estado}
            onValueChange={(v) => setEstado((v ?? 'todos') as FiltroEstado)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCampo>

        <FiltroCampo label="Cliente">
          <Select
            items={clienteItems}
            value={clienteId}
            onValueChange={(v) => setClienteId(v ?? 'todos')}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCampo>

        <FiltroCampo label="Desde">
          <DatePicker
            value={desde}
            onChange={setDesde}
            compact
            permitirPasadas
            placeholder="Cualquier fecha"
          />
        </FiltroCampo>

        <FiltroCampo label="Hasta">
          <DatePicker
            value={hasta}
            onChange={setHasta}
            compact
            permitirPasadas
            placeholder="Cualquier fecha"
          />
        </FiltroCampo>

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla en desktop (scroll horizontal: son muchas columnas) */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <HeadCell>Cod</HeadCell>
                <HeadCell>Exportado</HeadCell>
                <HeadCell>Estado crédito</HeadCell>
                <HeadCell>Forma pago</HeadCell>
                <HeadCell>Plazo crédito</HeadCell>
                <HeadCell>Estado</HeadCell>
                <HeadCell>Solicitado</HeadCell>
                <HeadCell>Tercero</HeadCell>
                <HeadCell>Cod cliente</HeadCell>
                <HeadCell>Punto entrega</HeadCell>
                <HeadCell>Creador</HeadCell>
                <HeadCell className="text-right">Solicitados</HeadCell>
                <HeadCell className="text-right">Total</HeadCell>
                <HeadCell>Moneda</HeadCell>
                <HeadCell className="text-right">Acción</HeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={15}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No hay pedidos para estos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((pedido) => (
                  <TableRow key={pedido.id} className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-[#00359a] whitespace-nowrap">
                      {pedido.numero}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.pvc ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {ESTADO_CREDITO_LABEL[pedido.estadoCredito]}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.formaPago}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.plazoCredito}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <EstadoBadge estado={pedido.estado} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.fechaSolicitud
                        ? formatFecha(pedido.fechaSolicitud.slice(0, 10))
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.clienteNombre}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.clienteId}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {sedeDePedido(pedido, getSede)?.nombre ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.creadorEmail}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">
                      {totalUnidades(pedido)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                      {formatCOP(totalesPedido(pedido, getProducto).total)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.moneda}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <AccionLink pedido={pedido} basePath={basePath} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tarjetas en móvil */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtrados.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            No hay pedidos para estos filtros.
          </Card>
        ) : (
          filtrados.map((pedido) => (
            <PedidoCardMovil
              key={pedido.id}
              pedido={pedido}
              total={totalesPedido(pedido, getProducto).total}
              sede={sedeDePedido(pedido, getSede)}
              basePath={basePath}
            />
          ))
        )}
      </div>
    </div>
  )
}

function FiltroCampo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function HeadCell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <TableHead
      className={`text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap ${className ?? ''}`}
    >
      {children}
    </TableHead>
  )
}

/** Acción según estado (replica la pantalla real): borrador → Editar, resto → Ver. */
function AccionLink({
  pedido,
  basePath,
}: {
  pedido: Pedido
  basePath: string
}) {
  const esBorrador = pedido.estado === 'en_construccion'
  return (
    <Link
      href={`${basePath}/${pedido.id}`}
      className="inline-flex items-center gap-1 text-sm font-medium text-[#ff6600] hover:underline"
    >
      {esBorrador ? (
        <Pencil className="size-3.5" />
      ) : (
        <Search className="size-3.5" />
      )}
      {esBorrador ? 'Editar' : 'Ver'}
    </Link>
  )
}

function PedidoCardMovil({
  pedido,
  total,
  sede,
  basePath,
}: {
  pedido: Pedido
  total: number
  sede: Sede | undefined
  basePath: string
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[#00359a]">{pedido.numero}</span>
        <EstadoBadge estado={pedido.estado} />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{pedido.clienteNombre}</span>
        <span className="text-muted-foreground">
          {pedido.fechaSolicitud
            ? `Solicitado: ${formatFecha(pedido.fechaSolicitud.slice(0, 10))}`
            : 'Sin solicitar'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Exportado: {pedido.pvc ?? '—'}</span>
        <span>Crédito: {ESTADO_CREDITO_LABEL[pedido.estadoCredito]}</span>
        <span>{pedido.formaPago}</span>
        <span>{pedido.plazoCredito}</span>
        <span className="col-span-2 truncate">
          Punto: {sede?.nombre ?? '—'}
        </span>
        <span className="col-span-2 truncate">
          Creador: {pedido.creadorEmail}
        </span>
        <span>
          Solicitados: {totalUnidades(pedido)}
        </span>
        <span>Moneda: {pedido.moneda}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tabular-nums text-primary">
          {formatCOP(total)}
        </span>
        <AccionLink pedido={pedido} basePath={basePath} />
      </div>
    </Card>
  )
}
