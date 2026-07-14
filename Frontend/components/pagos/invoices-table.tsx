import React, { useState, useMemo } from 'react'
import { Search, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PSEModal } from './pse-modal'
import { cn } from '@/lib/utils'

export interface Factura {
  numero: string
  pedidoCod: string
  fechaEmision: string
  fechaVencimiento: string
  valor: number
  diasParaVencer: number
  estado: 'Vencida' | 'Por vencer' | 'Vigente'
}

interface InvoicesTableProps {
  invoices: Factura[]
}

const statusConfig = {
  Vencida: { color: 'bg-red-100 text-red-700', label: 'Vencida' },
  'Por vencer': { color: 'bg-orange-100 text-orange-700', label: 'Por vencer' },
  Vigente: { color: 'bg-green-100 text-green-700', label: 'Vigente' },
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [pseModalOpen, setPseModalOpen] = useState(false)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.pedidoCod.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'todas' || inv.estado.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchQuery, statusFilter])

  const selectedData = useMemo(
    () => filteredInvoices.filter((inv) => selectedInvoices.has(inv.numero)),
    [filteredInvoices, selectedInvoices]
  )

  const totalSelected = selectedData.reduce((sum, inv) => sum + inv.valor, 0)

  const toggleInvoice = (numero: string) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(numero)) {
      newSelected.delete(numero)
    } else {
      newSelected.add(numero)
    }
    setSelectedInvoices(newSelected)
  }

  const toggleAllInvoices = () => {
    if (selectedInvoices.size === filteredInvoices.length && selectedInvoices.size > 0) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.numero)))
    }
  }

  const handleIndividualPay = (factura: Factura) => {
    setSelectedInvoices(new Set([factura.numero]))
    setPseModalOpen(true)
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Facturas pendientes</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Buscar por N° factura u OC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() => setPseModalOpen(true)}
                disabled={selectedInvoices.size === 0}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                Pagar seleccionadas
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-8 border-b border-gray-200">
            {['todas', 'vencidas', 'por vencer', 'vigentes'].map((value) => {
              const labels: Record<string, string> = {
                todas: 'Todas',
                vencidas: 'Vencidas',
                'por vencer': 'Por vencer',
                vigentes: 'Vigentes',
              }
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    statusFilter === value
                      ? 'text-[#ff6600] border-[#ff6600] font-semibold'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {labels[value]}
                </button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay facturas que coincidan con los filtros seleccionados
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-[#00359a]">
                      <TableHead className="w-10 py-4">
                        <Checkbox
                          checked={
                            selectedInvoices.size === filteredInvoices.length &&
                            filteredInvoices.length > 0
                          }
                          onCheckedChange={toggleAllInvoices}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Factura
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Pedido
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Fecha Emisión
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Fecha Vencimiento
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Valor
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                        Días
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
                    {filteredInvoices.map((factura) => (
                      <TableRow key={factura.numero} className="hover:bg-gray-50">
                        <TableCell className="py-4">
                          <Checkbox
                            checked={selectedInvoices.has(factura.numero)}
                            onCheckedChange={() => toggleInvoice(factura.numero)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-[#00359a] py-4">
                          {factura.numero}
                        </TableCell>
                        <TableCell className="text-[#00359a] hover:underline cursor-pointer py-4">
                          {factura.pedidoCod}
                        </TableCell>
                        <TableCell className="text-sm py-4">{factura.fechaEmision}</TableCell>
                        <TableCell className="text-sm py-4">{factura.fechaVencimiento}</TableCell>
                        <TableCell className="font-medium py-4">
                          ${factura.valor.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell
                          className={cn('font-medium py-4', {
                            'text-red-600 font-bold': factura.diasParaVencer < 0,
                            'text-gray-600': factura.diasParaVencer >= 0,
                          })}
                        >
                          {factura.diasParaVencer < 0
                            ? `${factura.diasParaVencer} días`
                            : `${factura.diasParaVencer} días`}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium', statusConfig[factura.estado].color)}>
                            <span className="w-2 h-2 rounded-full bg-current" />
                            {statusConfig[factura.estado].label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIndividualPay(factura)}
                            className="border-[#ff6600] text-[#ff6600] hover:bg-orange-50"
                          >
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Footer with payment button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm font-medium text-gray-700">
                  {selectedInvoices.size > 0 && (
                    <>
                      {selectedInvoices.size} factura{selectedInvoices.size !== 1 ? 's' : ''}{' '}
                      seleccionada{selectedInvoices.size !== 1 ? 's' : ''} · Total:{' '}
                      <span className="font-bold text-gray-900">
                        ${totalSelected.toLocaleString('es-CO')}
                      </span>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => setPseModalOpen(true)}
                  disabled={selectedInvoices.size === 0}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white gap-2"
                >
                  <CreditCard className="size-4" />
                  Pagar con PSE
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PSEModal
        open={pseModalOpen}
        onOpenChange={setPseModalOpen}
        invoices={Array.from(selectedInvoices).map((numero) => {
          const inv = invoices.find((i) => i.numero === numero)!
          return { numero, valor: inv.valor }
        })}
      />
    </>
  )
}
