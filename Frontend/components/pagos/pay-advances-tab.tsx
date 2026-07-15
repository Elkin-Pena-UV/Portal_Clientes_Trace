'use client'

import { useState } from 'react'
import { CheckCircle, CreditCard, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { PuntoEntregaCombobox } from '@/components/ordenes/punto-entrega-combobox'
import { usePortal } from '@/components/portal-provider'
import { PaymentStepper } from './payment-stepper'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function Step1SelectAdvance({
  onNext,
}: {
  onNext: (sede: string, monto: number) => void
}) {
  const { getPuntoEntrega } = usePortal()
  const [selectedSede, setSelectedSede] = useState('')
  const [monto, setMonto] = useState('')

  const handleMontoChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, '')) || 0
    setMonto(value)
  }

  const montoNum = parseInt(monto.replace(/\D/g, '')) || 0
  const isValid = selectedSede && montoNum > 0
  const sedeInfo = selectedSede ? getPuntoEntrega(selectedSede) : null

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <CreditCard className="size-8 text-[#ff6600]" />
          <div>
            <h3 className="text-lg font-bold">Realizar anticipo</h3>
            <p className="text-sm text-gray-600">
              Selecciona la sede y el valor que deseas anticipar. El pago se realiza
              en línea a través de PSE.
            </p>
          </div>
        </div>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Sede a la que harás el anticipo
              </Label>
              {/* Sin cascada por sede: el anticipo se asocia al punto del cliente. */}
              <PuntoEntregaCombobox
                value={selectedSede}
                onChange={setSelectedSede}
                placeholder="Selecciona una sede"
                allowCreate={false}
              />
            </div>

            <div>
              <Label htmlFor="monto" className="text-sm font-medium mb-2 block">
                Valor del anticipo
              </Label>
              <Input
                id="monto"
                type="text"
                placeholder="$ 0"
                value={monto}
                onChange={(e) => handleMontoChange(e.target.value)}
                className="max-w-[240px]"
              />
              <p className="text-xs text-gray-600 mt-2">
                Queda disponible para aplicar a futuras facturas una vez la
                plataforma confirme el recaudo (OK).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-medium">
          {sedeInfo ? (
            <>
              <p className="text-gray-700">{sedeInfo.nombre} · {sedeInfo.ciudad}</p>
              {montoNum > 0 && <p className="text-[#ff6600] mt-1">{formatCurrency(montoNum)}</p>}
            </>
          ) : (
            <p className="text-gray-500">Selecciona una sede</p>
          )}
        </div>
        <Button
          onClick={() => onNext(selectedSede, montoNum)}
          disabled={!isValid}
          className="gap-2 bg-[#ff6600] hover:bg-[#ff6600]/90"
        >
          <CreditCard className="size-4" />
          Pagar anticipo con PSE
        </Button>
      </div>
    </div>
  )
}

function Step2PaymentMethod({
  sede,
  monto,
  onNext,
  onBack,
}: {
  sede: string
  monto: number
  onNext: () => void
  onBack: () => void
}) {
  const { getPuntoEntrega } = usePortal()
  const [isRobot, setIsRobot] = useState(false)
  const sedeInfo = getPuntoEntrega(sede)

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
            <p className="text-sm text-gray-600">Sede</p>
            <p className="text-sm font-medium">{sedeInfo?.nombre} · {sedeInfo?.ciudad}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Valor del anticipo</p>
            <p className="text-sm font-medium">{formatCurrency(monto)}</p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Total a pagar</p>
            <p className="text-2xl font-bold text-[#00359a]">{formatCurrency(monto)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step3Confirmation({ onReset, monto }: { onReset: () => void; monto: number }) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="size-16 text-green-500" />
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2">¡Anticipo registrado!</h3>
        <p className="text-gray-600">
          Tu anticipo de {formatCurrency(monto)} ha sido registrado correctamente
        </p>
      </div>

      <Card className="text-left">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">N° de referencia:</span>
            <span className="font-semibold">REF-88232</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fecha:</span>
            <span className="font-semibold">14/06/2026 14:35</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Método:</span>
            <span className="font-semibold">PSE</span>
          </div>
          <div className="pt-3 border-t flex justify-between">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-lg font-bold text-[#00359a]">
              {formatCurrency(monto)}
            </span>
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

export function PayAdvancesTab() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedSede, setSelectedSede] = useState('')
  const [selectedMonto, setSelectedMonto] = useState(0)

  const steps = [
    { icon: CreditCard, label: 'Seleccionar anticipo' },
    { icon: Pause, label: 'Método de pago' },
    { icon: CheckCircle, label: 'Confirmación' },
  ]

  const handleStep1Next = (sede: string, monto: number) => {
    setSelectedSede(sede)
    setSelectedMonto(monto)
    setStep(2)
  }

  return (
    <div className="space-y-6">
      <PaymentStepper currentStep={step} steps={steps} />

      {step === 1 && <Step1SelectAdvance onNext={handleStep1Next} />}
      {step === 2 && (
        <Step2PaymentMethod
          sede={selectedSede}
          monto={selectedMonto}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Confirmation onReset={() => setStep(1)} monto={selectedMonto} />
      )}
    </div>
  )
}
