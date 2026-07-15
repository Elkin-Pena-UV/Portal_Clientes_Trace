'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'
import type { Pedido } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { totalesPedido } from '@/lib/order-utils'
import { formatCOP, formatFecha } from '@/lib/format'
import { EstadoBadge } from '@/components/pedidos/estado-badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Umbral de urgencia: un pedido 'solicitado' se considera urgente cuando
 * lleva MÁS de este número de días esperando desde su fechaSolicitud.
 */
const DIAS_UMBRAL_URGENTE = 3

/** Máximo de filas que muestra la card (el resto se ve en el listado completo). */
const MAX_FILAS_ATENCION = 5

function esUrgente(pedido: Pedido): boolean {
  if (pedido.estado !== 'solicitado' || !pedido.fechaSolicitud) return false
  const diasEspera =
    (Date.now() - new Date(pedido.fechaSolicitud).getTime()) /
    (1000 * 60 * 60 * 24)
  return diasEspera > DIAS_UMBRAL_URGENTE
}

/** Punto rojo que marca un pedido urgente junto al COD. */
function PuntoUrgente() {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-red-500"
      title={`Urgente: más de ${DIAS_UMBRAL_URGENTE} días en espera`}
    />
  )
}

export function PedidosAtencion() {
  const { pedidos, getProducto } = usePortal()

  const atencion = React.useMemo(
    () =>
      pedidos
        .filter((p) => p.estado === 'solicitado')
        .sort((a, b) =>
          (a.fechaSolicitud ?? '').localeCompare(b.fechaSolicitud ?? ''),
        )
        .slice(0, MAX_FILAS_ATENCION),
    [pedidos],
  )

  return (
    <Card className="gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">
            Pedidos que requieren atención
          </h3>
          <p className="text-xs text-muted-foreground">
            Solicitados más antiguos primero
          </p>
        </div>
        <Link
          href="/servicio/pedidos"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#ff6600] hover:underline"
        >
          Ver todos
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {atencion.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay pedidos solicitados en cola.
        </p>
      ) : (
        <>
          {/* Tabla compacta en desktop */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border hover:bg-transparent">
                  <HeadCell>Cod</HeadCell>
                  <HeadCell>Tercero</HeadCell>
                  <HeadCell>Estado</HeadCell>
                  <HeadCell>Solicitado</HeadCell>
                  <HeadCell className="text-right">Total</HeadCell>
                  <HeadCell className="text-right">Acción</HeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atencion.map((pedido) => (
                  <TableRow key={pedido.id} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {esUrgente(pedido) && <PuntoUrgente />}
                        <Link
                          href={`/servicio/pedidos/${pedido.id}`}
                          className="font-semibold text-[#00359a] hover:underline"
                        >
                          {pedido.numero}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.clienteNombre}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <EstadoBadge estado={pedido.estado} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {pedido.fechaSolicitud
                        ? formatFecha(pedido.fechaSolicitud.slice(0, 10))
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                      {formatCOP(totalesPedido(pedido, getProducto).total)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Link
                        href={`/servicio/pedidos/${pedido.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#ff6600] hover:underline"
                      >
                        <Eye className="size-3.5" />
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Tarjetas en móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {atencion.map((pedido) => (
              <div
                key={pedido.id}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {esUrgente(pedido) && <PuntoUrgente />}
                    <Link
                      href={`/servicio/pedidos/${pedido.id}`}
                      className="font-semibold text-[#00359a] hover:underline"
                    >
                      {pedido.numero}
                    </Link>
                  </span>
                  <EstadoBadge estado={pedido.estado} />
                </div>
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="font-medium">{pedido.clienteNombre}</span>
                  <span className="text-muted-foreground">
                    {pedido.fechaSolicitud
                      ? `Solicitado: ${formatFecha(pedido.fechaSolicitud.slice(0, 10))}`
                      : 'Sin fecha de solicitud'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold tabular-nums text-primary">
                    {formatCOP(totalesPedido(pedido, getProducto).total)}
                  </span>
                  <Link
                    href={`/servicio/pedidos/${pedido.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#ff6600] hover:underline"
                  >
                    <Eye className="size-3.5" />
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
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
