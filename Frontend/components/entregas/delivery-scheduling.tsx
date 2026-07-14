'use client'

import React, { useState } from 'react'
import { Calendar, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface EntregaProgramada {
  id: string
  fecha: string
  hora: string
  pvc: string
  producto: string
  cantidad: string
  zona: string
  estado: 'Confirmada' | 'Programada' | 'Tentativa'
}

interface DiaEntregas {
  fecha: string
  dia: string
  entregas: EntregaProgramada[]
}

const mockDeliveries: EntregaProgramada[] = [
  {
    id: '1',
    fecha: '2026-06-16',
    hora: '07:00',
    pvc: 'PVC-275293',
    producto: 'Cemento UG x 50 kg',
    cantidad: '320 sacos',
    zona: 'Obra Norte – Torre A',
    estado: 'Confirmada',
  },
  {
    id: '2',
    fecha: '2026-06-16',
    hora: '11:30',
    pvc: 'PVC-275301',
    producto: 'Cemento ART Granel',
    cantidad: '14 ton',
    zona: 'Centro de acopio',
    estado: 'Confirmada',
  },
  {
    id: '3',
    fecha: '2026-06-17',
    hora: '08:00',
    pvc: 'PVC-275312',
    producto: 'Estuco Interior x 25 kg',
    cantidad: '180 sacos',
    zona: 'Bodega principal',
    estado: 'Programada',
  },
  {
    id: '4',
    fecha: '2026-06-18',
    hora: '06:30',
    pvc: 'PVC-275320',
    producto: 'Cemento UG x 50 kg',
    cantidad: '240 sacos',
    zona: 'Patio de descargue 2',
    estado: 'Programada',
  },
  {
    id: '5',
    fecha: '2026-06-18',
    hora: '14:00',
    pvc: 'PVC-275322',
    producto: 'Mortero Seco Pega',
    cantidad: '90 sacos',
    zona: 'Obra Norte – Torre A',
    estado: 'Tentativa',
  },
]

function groupDeliveriesByDate(deliveries: EntregaProgramada[]): DiaEntregas[] {
  const grouped: Record<string, EntregaProgramada[]> = {}

  deliveries.forEach((delivery) => {
    if (!grouped[delivery.fecha]) {
      grouped[delivery.fecha] = []
    }
    grouped[delivery.fecha].push(delivery)
  })

  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([fecha, entregas]) => ({
      fecha,
      dia: formatDayHeader(fecha),
      entregas: entregas.sort((a, b) => a.hora.localeCompare(b.hora)),
    }))
}

function formatDayHeader(dateString: string): string {
  const date = new Date(dateString)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ]

  const dayName = days[date.getUTCDay()]
  const dayNum = date.getUTCDate()
  const monthName = months[date.getUTCMonth()]

  return `${dayName} ${dayNum} ${monthName}`
}

function getStatusBadgeClasses(estado: string): string {
  switch (estado) {
    case 'Confirmada':
      return 'bg-green-100 text-green-700'
    case 'Programada':
      return 'bg-indigo-100 text-indigo-700'
    case 'Tentativa':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function DeliveryScheduling() {
  const diasConEntregas = groupDeliveriesByDate(mockDeliveries)
  const [expandedDay, setExpandedDay] = useState<string | null>(
    diasConEntregas[0]?.fecha || null
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Informative Banner */}
      <Alert className="border-0 bg-blue-50 text-gray-900">
        <Info className="h-4 w-4 text-[#00359a]" />
        <AlertDescription className="text-sm text-gray-700 ml-2">
          Estas son tus entregas confirmadas y programadas. Las entregas tentativas dependen de disponibilidad de flota.
        </AlertDescription>
      </Alert>

      {/* Day Cards */}
      <div className="space-y-6">
        {diasConEntregas.map((dia) => (
          <Card key={dia.fecha} className="border border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-[#00359a]" />
                  <CardTitle className="text-base font-bold text-gray-900">
                    {dia.dia}
                  </CardTitle>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {dia.entregas.length} entrega{dia.entregas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-[#00359a]">
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        HORA
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        PVC
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        PRODUCTO
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        CANTIDAD
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        ZONA
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        ESTADO
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dia.entregas.map((entrega) => (
                      <TableRow
                        key={entrega.id}
                        className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                      >
                        <TableCell className="font-semibold text-gray-900 whitespace-nowrap py-4">
                          {entrega.hora}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 whitespace-nowrap py-4">
                          {entrega.pvc}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 py-4">
                          {entrega.producto}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 whitespace-nowrap py-4">
                          {entrega.cantidad}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 py-4">
                          {entrega.zona}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={cn(
                              'text-xs font-medium rounded-full px-3 py-1',
                              getStatusBadgeClasses(entrega.estado)
                            )}
                          >
                            {entrega.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden space-y-3 pt-4">
                {dia.entregas.map((entrega) => (
                  <div
                    key={entrega.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {entrega.hora}
                      </span>
                      <Badge
                        className={cn(
                          'text-xs font-medium rounded-full px-3 py-1',
                          getStatusBadgeClasses(entrega.estado)
                        )}
                      >
                        {entrega.estado}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold">
                          PVC
                        </span>
                        <p className="text-gray-900 font-medium">{entrega.pvc}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs uppercase font-semibold">
                          Producto
                        </span>
                        <p className="text-gray-900">{entrega.producto}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-semibold">
                            Cantidad
                          </span>
                          <p className="text-gray-900">{entrega.cantidad}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-semibold">
                            Zona
                          </span>
                          <p className="text-gray-900">{entrega.zona}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
