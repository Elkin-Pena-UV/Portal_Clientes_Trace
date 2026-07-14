'use client'

import * as React from 'react'
import Link from 'next/link'
import type { EstadoPedido, Pedido } from '@/lib/types'
import { ESTADO_LABEL } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { totalesPedido } from '@/lib/order-utils'
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

export function ListadoPedidos({
  modo,
  basePath,
  estadoInicial,
}: ListadoPedidosProps) {
  const { pedidos, getProducto } = usePortal()
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

  const accionLabel = modo === 'gestion' ? 'Gestionar' : 'Ver'

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

      {/* Tabla en desktop */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <HeadCell>Número</HeadCell>
              <HeadCell>Cliente</HeadCell>
              <HeadCell>Fecha</HeadCell>
              <HeadCell>Estado</HeadCell>
              <HeadCell className="text-right">Total</HeadCell>
              <HeadCell className="text-right">Acción</HeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
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
                    {pedido.clienteNombre}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatFecha(pedido.fechaCreacion.slice(0, 10))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <EstadoBadge estado={pedido.estado} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                    {formatCOP(totalesPedido(pedido, getProducto).total)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <AccionLink
                      href={`${basePath}/${pedido.id}`}
                      label={accionLabel}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
              href={`${basePath}/${pedido.id}`}
              accionLabel={accionLabel}
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

function AccionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[#ff6600] hover:underline"
    >
      {label}
    </Link>
  )
}

function PedidoCardMovil({
  pedido,
  total,
  href,
  accionLabel,
}: {
  pedido: Pedido
  total: number
  href: string
  accionLabel: string
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
          {formatFecha(pedido.fechaCreacion.slice(0, 10))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tabular-nums text-primary">
          {formatCOP(total)}
        </span>
        <AccionLink href={href} label={accionLabel} />
      </div>
    </Card>
  )
}
