'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, FileText, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { FilterDialog, type FilterValues } from './filter-dialog'
import { cn } from '@/lib/utils'

export interface OrderRow {
  id: string
  cod: string
  pvc: string
  oc: string
  date: string
  location: string
  value: string
  status: 'entregado' | 'en-transito' | 'en-construccion' | 'anulado'
}

interface OrderHistoryProps {
  orders: OrderRow[]
  onOrderClick?: (order: OrderRow) => void
}

const statusConfig = {
  entregado: {
    label: 'Entregado',
    color: 'bg-green-100 text-green-700',
  },
  'en-transito': {
    label: 'En tránsito',
    color: 'bg-blue-100 text-blue-700',
  },
  'en-construccion': {
    label: 'En construcción',
    color: 'bg-orange-100 text-orange-700',
  },
  anulado: {
    label: 'Anulado',
    color: 'bg-gray-100 text-gray-600',
  },
}

export function OrderHistory({ orders, onOrderClick }: OrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [valueFrom, setValueFrom] = useState('')
  const [valueTo, setValueTo] = useState('')
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<Partial<FilterValues>>({})

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        order.cod.toLowerCase().includes(query) ||
        order.pvc.toLowerCase().includes(query) ||
        order.oc.toLowerCase().includes(query)

      if (!matchesSearch) return false

      // Status filter
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const orderDate = new Date(order.date)
        const filterDate = new Date(dateFrom)
        if (orderDate < filterDate) return false
      }
      if (dateTo) {
        const orderDate = new Date(order.date)
        const filterDate = new Date(dateTo)
        if (orderDate > filterDate) return false
      }

      // Value range filter (removing currency symbols for comparison)
      if (valueFrom || valueTo) {
        const orderValue = parseFloat(order.value.replace(/[$.,]/g, ''))
        if (valueFrom && orderValue < parseFloat(valueFrom)) return false
        if (valueTo && orderValue > parseFloat(valueTo)) return false
      }

      return true
    })
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo, valueFrom, valueTo])

  const handleExport = () => {
    const headers = ['COD', 'PVC', 'ORDEN COMPRA', 'FECHA', 'SEDE', 'VALOR', 'ESTADO']
    const rows = filteredOrders.map((order) => [
      order.cod,
      order.pvc,
      order.oc,
      order.date,
      order.location,
      order.value,
      statusConfig[order.status].label,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleApplyFilters = (filters: FilterValues) => {
    setAppliedFilters(filters)
    if (filters.dateFrom) setDateFrom(filters.dateFrom)
    if (filters.status) setStatusFilter(filters.status)
    // Additional filters can be stored but not used in current filtering logic
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg">Historial de pedidos</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por Cod, PVC u OC..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 flex-1 md:flex-initial"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter className="size-4" />
              Filtro general
            </Button>

            <Button variant="outline" className="gap-2 flex-1 md:flex-initial" onClick={handleExport}>
              <FileText className="size-4" />
              Exportar a Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status tabs with horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-6 md:mx-0 md:overflow-x-visible">
          <div className="flex gap-8 border-b border-gray-200 px-6 md:px-0 whitespace-nowrap md:whitespace-normal">
            {['todos', 'en-transito', 'entregado', 'en-construccion', 'anulado'].map((value) => {
              const labels: Record<string, string> = {
                todos: 'Todos',
                'en-transito': 'En tránsito',
                entregado: 'Entregados',
                'en-construccion': 'En construcción',
                anulado: 'Anulados',
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
        </div>
            {/* Table with horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <div className="inline-block min-w-full md:w-full px-6 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-[#00359a]">
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        COD
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        PVC
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto hidden md:table-cell">
                        ORDEN COMPRA
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        FECHA
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto hidden md:table-cell">
                        SEDE
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto hidden md:table-cell">
                        VALOR
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        ESTADO
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-[#00359a] whitespace-nowrap py-4 h-auto">
                        ACCIÓN
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <TableCell className="font-semibold text-[#00359a] whitespace-nowrap py-4 text-sm">
                          {order.cod}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap py-4">
                          {order.pvc}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap py-4 hidden md:table-cell">
                          {order.oc}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap py-4">
                          {order.date}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap py-4 hidden md:table-cell">
                          {order.location}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground whitespace-nowrap py-4 hidden md:table-cell">
                          {order.value}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <div className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs md:text-sm font-medium',
                            statusConfig[order.status].color
                          )}>
                            <span className="w-2 h-2 rounded-full bg-current" />
                            <span className="hidden md:inline">{statusConfig[order.status].label}</span>
                            <span className="md:hidden">{statusConfig[order.status].label.split(' ')[0]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap py-4">
                          <button
                            onClick={() => onOrderClick?.(order)}
                            className="text-[#00359a] font-medium text-sm hover:underline flex items-center gap-1 justify-end"
                          >
                            Ver
                            <ChevronRight className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay pedidos que coincidan con los filtros seleccionados
              </div>
            )}
      </CardContent>

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        onApply={handleApplyFilters}
        initialValues={appliedFilters}
        sedes={[
          { id: 'cali', name: 'Cali – Planta SC' },
          { id: 'yumbo', name: 'Yumbo – San Marcos' },
          { id: 'palmira', name: 'Palmira – Zona Franca' },
        ]}
      />
    </Card>
  )
}
