import React, { useState } from 'react'
import { CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface Invoice {
  numero: string
  valor: number
}

interface PSEModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoices: Invoice[]
  onConfirm?: () => void
}

const BANKS = [
  { id: 'bancolombia', name: 'Bancolombia' },
  { id: 'bbva', name: 'BBVA' },
  { id: 'davivienda', name: 'Davivienda' },
  { id: 'santander', name: 'Santander' },
  { id: 'itau', name: 'Itaú' },
]

export function PSEModal({ open, onOpenChange, invoices, onConfirm }: PSEModalProps) {
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [personType, setPersonType] = useState<string>('natural')

  const total = invoices.reduce((sum, inv) => sum + inv.valor, 0)

  const handleContinue = () => {
    // Simular redirección a PSE
    console.log('Redirigiendo a PSE con:', {
      banco: selectedBank,
      tipoPersona: personType,
      facturas: invoices,
      total,
    })
    alert(`Siendo redirigido a ${BANKS.find(b => b.id === selectedBank)?.name || 'PSE'}...`)
    onOpenChange(false)
    onConfirm?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-[#ff6600]" />
            Pagar con PSE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumen de facturas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Facturas a pagar</h3>
            <div className="space-y-2 mb-4">
              {invoices.map((inv) => (
                <div key={inv.numero} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{inv.numero}</span>
                  <span className="font-medium text-gray-900">
                    ${inv.valor.toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total a pagar</span>
              <span className="text-lg font-bold text-[#ff6600]">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Selector de banco */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Selecciona tu banco</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige un banco" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de persona */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Tipo de persona</Label>
            <RadioGroup value={personType} onValueChange={setPersonType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="natural" id="natural" />
                <Label htmlFor="natural" className="cursor-pointer font-normal">
                  Persona Natural
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="juridica" id="juridica" />
                <Label htmlFor="juridica" className="cursor-pointer font-normal">
                  Persona Jurídica
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nota de seguridad */}
          <p className="text-xs text-gray-500 italic">
            Serás redirigido a la plataforma segura de PSE para completar tu pago.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedBank}
            className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
          >
            Continuar al banco
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
