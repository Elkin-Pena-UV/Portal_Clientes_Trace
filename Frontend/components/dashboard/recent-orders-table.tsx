'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockOrders = [
  {
    id: 'T-292313',
    pvc: 'PVC-275293',
    fecha: '06 jun 2026',
    valor: '$14.820.000',
    estado: 'Entregado',
  },
  {
    id: 'T-292208',
    pvc: 'PVC-275251',
    fecha: '02 jun 2026',
    valor: '$6.720.000',
    estado: 'Entregado',
  },
  {
    id: 'T-291786',
    pvc: '—',
    fecha: '30 may 2026',
    valor: '$21.300.000',
    estado: 'En construcción',
  },
  {
    id: 'T-291640',
    pvc: 'PVC-275190',
    fecha: '28 may 2026',
    valor: '$4.150.000',
    estado: 'Entregado',
  },
]

function getStatusBadge(estado: string) {
  switch (estado) {
    case 'Entregado':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          {estado}
        </Badge>
      )
    case 'En construcción':
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          {estado}
        </Badge>
      )
    case 'En tránsito':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          {estado}
        </Badge>
      )
    case 'Cancelado':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          {estado}
        </Badge>
      )
    default:
      return <Badge>{estado}</Badge>
  }
}

export function RecentOrdersTable() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 md:px-6 py-3 md:py-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground">
          Pedidos recientes
        </h2>
        <Link
          href="/mis-pedidos"
          className="flex items-center gap-1 text-xs md:text-sm text-[#ff6600] hover:underline"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {/* Responsive table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full md:w-full px-4 md:px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                  Pedido
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                  PVC
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                  Fecha
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                  Valor
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-[#00359a] whitespace-nowrap">
                    <Link href="/" className="hover:underline">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{order.pvc}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{order.fecha}</TableCell>
                  <TableCell className="text-sm font-medium whitespace-nowrap">{order.valor}</TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(order.estado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}
