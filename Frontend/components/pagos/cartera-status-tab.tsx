'use client'

import { Download, Copy, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface TransactionRecord {
  id: string
  numero: string
  fechaCreacion: string
  valor: number
  proceso: 'ANTICIPO' | 'ABONO'
  descripcion: string
  estado: 'En proceso' | 'Confirmado' | 'Rechazado'
  estadoTecnico: 'CREATED' | 'OK' | 'NOT_AUTHORIZED'
  pasarela: string
  recaudo: string
  expira: string
}

const mockData: TransactionRecord[] = [
  {
    id: '1',
    numero: '396',
    fechaCreacion: '14/06/2026 08:33',
    valor: 1000000,
    proceso: 'ANTICIPO',
    descripcion: 'Pago Anticipo PortalCartera',
    estado: 'En proceso',
    estadoTecnico: 'CREATED',
    pasarela: 'PSE',
    recaudo: '302',
    expira: '14/06/2026 08:54',
  },
  {
    id: '2',
    numero: '395',
    fechaCreacion: '13/06/2026 10:11',
    valor: 1000000,
    proceso: 'ANTICIPO',
    descripcion: 'Pago Anticipo PortalCartera',
    estado: 'En proceso',
    estadoTecnico: 'CREATED',
    pasarela: 'PSE',
    recaudo: '301',
    expira: '13/06/2026 10:32',
  },
  {
    id: '3',
    numero: '248',
    fechaCreacion: '21/11/2025 11:05',
    valor: 1000000,
    proceso: 'ANTICIPO',
    descripcion: 'Pago Anticipo PortalCartera',
    estado: 'Rechazado',
    estadoTecnico: 'NOT_AUTHORIZED',
    pasarela: 'PSE',
    recaudo: '245',
    expira: '21/11/2025 11:26',
  },
  {
    id: '4',
    numero: '211',
    fechaCreacion: '19/10/2025 08:54',
    valor: 2040000,
    proceso: 'ANTICIPO',
    descripcion: 'Pago Anticipo PortalCartera',
    estado: 'Rechazado',
    estadoTecnico: 'NOT_AUTHORIZED',
    pasarela: 'PSE',
    recaudo: '207',
    expira: '19/10/2025 09:15',
  },
  {
    id: '5',
    numero: '138',
    fechaCreacion: '11/08/2025 03:02',
    valor: 1000000,
    proceso: 'ABONO',
    descripcion: 'Pago Anticipo PortalCartera',
    estado: 'Confirmado',
    estadoTecnico: 'OK',
    pasarela: 'PSE',
    recaudo: '138',
    expira: '11/08/2025 03:24',
  },
]

function getEstadoColor(estado: string) {
  if (estado === 'Confirmado') return 'bg-green-100 text-green-800'
  if (estado === 'Rechazado') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

function getRowBg(estado: string) {
  if (estado === 'Confirmado') return 'bg-green-50'
  if (estado === 'Rechazado') return 'bg-red-50'
  return 'white'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

export function CarteraStatusTab() {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Estado de cartera</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Exportar a Excel
          </Button>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Buscar por N.°, proceso o recaudo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#00359a]">
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  N.°
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  FECHA CREACIÓN
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  VALOR
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  PROCESO
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  DESCRIPCIÓN
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  ESTADO
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  PASARELA
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  RECAUDO
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                  EXPIRA
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((record) => (
                <TableRow
                  key={record.id}
                  className={cn('hover:bg-gray-50 border-b border-gray-100', getRowBg(record.estado))}
                >
                  <TableCell className="py-4 font-semibold text-[#00359a]">{record.numero}</TableCell>
                  <TableCell className="py-4 text-sm">{record.fechaCreacion}</TableCell>
                  <TableCell className="py-4 text-sm font-medium">{formatCurrency(record.valor)}</TableCell>
                  <TableCell className="py-4">
                    <span className="inline-block bg-gray-200 text-gray-800 px-2.5 py-1 rounded text-xs font-medium">
                      {record.proceso}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-sm">{record.descripcion}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-block px-2.5 py-1 rounded text-xs font-medium', getEstadoColor(record.estado))}>
                        {record.estado}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Info className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Código técnico: {record.estadoTecnico}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm">{record.pasarela}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{record.recaudo}</span>
                      <button
                        onClick={() => handleCopy(record.recaudo)}
                        className="text-gray-400 hover:text-[#00359a] transition-colors"
                        title="Copiar al portapapeles"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm">{record.expira}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
