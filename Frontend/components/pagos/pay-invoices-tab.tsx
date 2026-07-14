'use client'

import { useState } from 'react'
import { Download, CheckCircle, CreditCard, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaymentStepper } from './payment-stepper'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  numero: string
  fechaFactura: string
  vencimiento: string
  saldo: number
  estado: 'Vencida' | 'Por vencer' | 'Vigente'
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    numero: 'FVE-44821',
    fechaFactura: '21 may 2026',
    vencimiento: '11 jun 2026',
    saldo: 18420000,
    estado: 'Por vencer',
  },
  {
    id: '2',
    numero: 'FVE-44780',
    fechaFactura: '19 may 2026',
    vencimiento: '18 jun 2026',
    saldo: 12750000,
    estado: 'Vigente',
  },
  {
    id: '3',
    numero: 'FVE-44712',
    fechaFactura: '06 may 2026',
    vencimiento: '05 jun 2026',
    saldo: 9680000,
    estado: 'Vencida',
  },
  {
    id: '4',
    numero: 'FVE-44698',
    fechaFactura: '28 may 2026',
    vencimiento: '27 jun 2026',
    saldo: 22100000,
    estado: 'Vigente',
  },
  {
    id: '5',
    numero: 'FVE-44655',
    fechaFactura: '03 may 2026',
    vencimiento: '02 jun 2026',
    saldo: 7300000,
    estado: 'Vencida',
  },
]

function getEstadoColor(estado: string) {
  if (estado === 'Vencida') return 'bg-red-100 text-red-800'
  if (estado === 'Por vencer') return 'bg-orange-100 text-orange-800'
  return 'bg-green-100 text-green-800'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function Step1SelectInvoices({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [montos, setMontos] = useState<Record<string, number>>({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleSelectAll = () => {
    if (selected.length === mockInvoices.length) {
      setSelected([])
    } else {
      setSelected(mockInvoices.map((i) => i.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleMontoChange = (id: string, value: string) => {
    const invoice = mockInvoices.find((i) => i.id === id)
    const numValue = parseInt(value.replace(/\D/g, '')) || 0
    if (numValue <= (invoice?.saldo || 0)) {
      setMontos((prev) => ({ ...prev, [id]: numValue }))
    }
  }

  const total = selected.reduce((sum, id) => {
    const invoice = mockInvoices.find((i) => i.id === id)
    return sum + (montos[id] || invoice?.saldo || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Facturas a pagar</CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Exportar a Excel
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por N.° de factura..."
          className="max-w-sm"
        />
        <Input
          type="date"
          placeholder="Fecha desde"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="date"
          placeholder="Fecha hasta"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#00359a]">
              <TableHead className="w-10 text-xs font-semibold uppercase text-[#00359a] py-4">
                <Checkbox
                  checked={selected.length === mockInvoices.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                N.° FACTURA
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                FECHA FACTURA
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                VENCIMIENTO
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                SALDO (CON IVA)
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                MONTO A PAGAR
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#00359a] py-4">
                ESTADO
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="hover:bg-gray-50 border-b border-gray-100"
              >
                <TableCell className="py-4">
                  <Checkbox
                    checked={selected.includes(invoice.id)}
                    onCheckedChange={() => handleSelect(invoice.id)}
                  />
                </TableCell>
                <TableCell className="py-4 font-semibold text-[#00359a]">
                  {invoice.numero}
                </TableCell>
                <TableCell className="py-4 text-sm">{invoice.fechaFactura}</TableCell>
                <TableCell className="py-4 text-sm">{invoice.vencimiento}</TableCell>
                <TableCell className="py-4 text-sm font-medium">
                  {formatCurrency(invoice.saldo)}
                </TableCell>
                <TableCell className="py-4">
                  {selected.includes(invoice.id) ? (
                    <Input
                      type="text"
                      value={
                        montos[invoice.id]
                          ? formatCurrency(montos[invoice.id])
                          : formatCurrency(invoice.saldo)
                      }
                      onChange={(e) => handleMontoChange(invoice.id, e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={cn(
                      'inline-block px-2.5 py-1 rounded text-xs font-medium',
                      getEstadoColor(invoice.estado)
                    )}
                  >
                    {invoice.estado}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium">
          {selected.length} factura(s) seleccionada(s) · {formatCurrency(total)}
        </span>
        <Button
          onClick={onNext}
          disabled={selected.length === 0}
          className="gap-2 bg-[#ff6600] hover:bg-[#ff6600]/90"
        >
          <CreditCard className="size-4" />
          Pagar con PSE
        </Button>
      </div>
    </div>
  )
}

function Step2PaymentMethod({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [isRobot, setIsRobot] = useState(false)

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Método de pago</Label>
          <div className="p-4 border-2 border-[#00359a] rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <RadioGroup value="pse" defaultValue="pse">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pse" id="pse" />
                  <Label htmlFor="pse" className="font-medium cursor-pointer">
                    Pagar en línea (PSE)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              id="robot"
              checked={isRobot}
              onCheckedChange={() => setIsRobot(!isRobot)}
            />
            <Label htmlFor="robot" className="cursor-pointer">
              No soy un robot
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onNext}
            disabled={!isRobot}
            className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90"
          >
            Continuar con el pago
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1">
            Cancelar el pago
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Facturas a pagar</p>
            <div className="space-y-1">
              <p className="text-sm font-medium">FVE-44821</p>
              <p className="text-sm text-gray-600">$18.420.000</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Total a pagar</p>
            <p className="text-2xl font-bold text-[#00359a]">$18.420.000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step3Confirmation({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="size-16 text-green-500" />
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">¡Pago realizado con éxito!</h3>
        <p className="text-gray-600">Tu pago de $18.420.000 ha sido procesado correctamente</p>
      </div>

      <Card className="text-left">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">N° de referencia:</span>
            <span className="font-semibold">REF-88231</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fecha:</span>
            <span className="font-semibold">14/06/2026 14:32</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Facturas pagadas:</span>
            <span className="font-semibold">FVE-44821</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Método:</span>
            <span className="font-semibold">PSE</span>
          </div>
          <div className="pt-3 border-t flex justify-between">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-lg font-bold text-[#00359a]">$18.420.000</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          Descargar comprobante
        </Button>
        <Button onClick={onReset} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
          Volver a Pagos
        </Button>
      </div>
    </div>
  )
}

export function PayInvoicesTab() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const steps = [
    { icon: CreditCard, label: 'Seleccionar factura' },
    { icon: Pause, label: 'Método de pago' },
    { icon: CheckCircle, label: 'Confirmación' },
  ]

  return (
    <div className="space-y-6">
      <PaymentStepper currentStep={step} steps={steps} />

      {step === 1 && <Step1SelectInvoices onNext={() => setStep(2)} />}
      {step === 2 && (
        <Step2PaymentMethod onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && <Step3Confirmation onReset={() => setStep(1)} />}
    </div>
  )
}
