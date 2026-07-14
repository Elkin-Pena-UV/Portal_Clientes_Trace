'use client'

import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterValues {
  dateFrom: string
  cod: string
  oc: string
  location: string
  status: string
}

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (filters: FilterValues) => void
  initialValues?: Partial<FilterValues>
  sedes?: { id: string; name: string }[]
}

export function FilterDialog({
  open,
  onOpenChange,
  onApply,
  initialValues,
  sedes = [],
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: initialValues?.dateFrom || '',
    cod: initialValues?.cod || '',
    oc: initialValues?.oc || '',
    location: initialValues?.location || '',
    status: initialValues?.status || '',
  })

  useEffect(() => {
    if (initialValues) {
      setFilters((prev) => ({
        ...prev,
        ...initialValues,
      }))
    }
  }, [initialValues, open])

  const handleClear = () => {
    setFilters({
      dateFrom: '',
      cod: '',
      oc: '',
      location: '',
      status: '',
    })
  }

  const handleApply = () => {
    onApply(filters)
    onOpenChange(false)
  }

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-bold">Filtro general</DialogTitle>
        </DialogHeader>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 py-6">
          {/* Fecha creación */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Fecha creación
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="dd/mm/aaaa"
              className="w-full border-gray-300 rounded-lg focus:border-[#ff6600]"
            />
          </div>

          {/* Cod */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Cod
            </label>
            <Input
              type="text"
              value={filters.cod}
              onChange={(e) => handleFilterChange('cod', e.target.value)}
              placeholder="Ingrese cod"
              className="w-full border-gray-300 rounded-lg focus:border-[#ff6600]"
            />
          </div>

          {/* Orden de compra */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Orden de compra
            </label>
            <Input
              type="text"
              value={filters.oc}
              onChange={(e) => handleFilterChange('oc', e.target.value)}
              placeholder="Ingrese orden de compra"
              className="w-full border-gray-300 rounded-lg focus:border-[#ff6600]"
            />
          </div>

          {/* Punto de entrega */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Punto de entrega
            </label>
            <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
              <SelectTrigger className="w-full border-gray-300 rounded-lg">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {sedes.map((sede) => (
                  <SelectItem key={sede.id} value={sede.id}>
                    {sede.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Estado
            </label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-full border-gray-300 rounded-lg">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="en-transito">En tránsito</SelectItem>
                <SelectItem value="en-construccion">En construcción</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-gray-600 text-sm font-medium hover:underline"
          >
            Limpiar
          </button>
          <Button
            onClick={handleApply}
            className="bg-[#ff6600] hover:bg-[#e55a00] text-white rounded-lg flex items-center gap-2"
          >
            <Search className="size-4" />
            Aplicar filtro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
