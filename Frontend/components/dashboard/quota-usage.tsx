'use client'

import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function QuotaUsage() {
  const quotaPercentage = 64
  const used = 512000000
  const total = 800000000
  const available = total - used

  return (
    <Card className="flex flex-col gap-4 md:gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base md:text-lg font-semibold text-foreground">
          Uso del cupo
        </h2>
        <Badge className="bg-[#ff6600] text-white hover:bg-[#ff6600]/90 text-xs md:text-sm">
          {quotaPercentage}%
        </Badge>
      </div>

      {/* Text */}
      <p className="text-xs md:text-sm text-muted-foreground">
        ${used.toLocaleString('es-CO')} utilizados de ${total.toLocaleString('es-CO')}
      </p>

      {/* Progress Bar */}
      <Progress value={quotaPercentage} className="h-2" />

      {/* Alert */}
      <Alert className="border-[#00359a]/20 bg-blue-50">
        <Info className="h-4 w-4 text-[#00359a]" />
        <AlertDescription className="text-sm text-[#00359a]">
          Tienes ${available.toLocaleString('es-CO')} disponibles. El cupo se libera a medida que pagas tu cartera.
        </AlertDescription>
      </Alert>

      {/* CTA Button */}
      <Button
        className="w-full bg-[#ff6600] text-white hover:bg-[#ff6600]/90"
      >
        + Crear nueva orden
      </Button>
    </Card>
  )
}
