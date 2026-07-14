import React from 'react'
import { Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface PagoHistorico {
  fecha: string
  referencia: string
  metodo: 'PSE' | 'Transferencia' | 'Cheque'
  facturasPagadas: string[]
  valor: number
  estado: 'Aprobado' | 'Procesando' | 'Rechazado'
}

interface PaymentHistoryProps {
  payments: PagoHistorico[]
}

const statusConfig = {
  Aprobado: { color: 'bg-green-100 text-green-700', label: 'Aprobado' },
  Procesando: { color: 'bg-blue-100 text-blue-700', label: 'Procesando' },
  Rechazado: { color: 'bg-red-100 text-red-700', label: 'Rechazado' },
}

const methodIcons = {
  PSE: '💳',
  Transferencia: '🏦',
  Cheque: '📄',
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const handleDownload = (referencia: string) => {
    alert(`Descargando comprobante de pago: ${referencia}`)
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Historial de pagos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#ff6600] text-[#ff6600] hover:bg-orange-50"
          >
            <Download className="size-4" />
            Exportar a Excel
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay pagos registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-[#00359a]">
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Fecha Pago
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Referencia
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Método
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Facturas Pagadas
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Valor
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                    Estado
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4 text-right">
                    Acción
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pago, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="text-sm py-4">{pago.fecha}</TableCell>
                    <TableCell className="font-medium py-4">{pago.referencia}</TableCell>
                    <TableCell className="py-4">
                      <span className="text-lg">{methodIcons[pago.metodo]}</span>
                      <span className="ml-2 text-sm text-gray-700">{pago.metodo}</span>
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      {pago.facturasPagadas.join(', ')}
                    </TableCell>
                    <TableCell className="font-medium py-4">
                      ${pago.valor.toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium', statusConfig[pago.estado].color)}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {statusConfig[pago.estado].label}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(pago.referencia)}
                        className="text-[#00359a] hover:bg-blue-50"
                      >
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
