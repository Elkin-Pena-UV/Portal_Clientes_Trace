'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  'Tipo de producto',
  'Método de despacho',
  'Productos',
  'Confirmar',
]

export function OrderStepper({ current }: { current: number }) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((label, index) => {
        const status =
          index < current ? 'complete' : index === current ? 'current' : 'pending'
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  status === 'complete' &&
                    'border-brand bg-brand text-brand-foreground',
                  status === 'current' &&
                    'border-primary bg-primary/10 text-primary',
                  status === 'pending' &&
                    'border-border bg-muted text-muted-foreground',
                )}
              >
                {status === 'complete' ? (
                  <Check className="size-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium md:inline',
                  status === 'pending'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  'h-px flex-1 transition-colors',
                  index < current ? 'bg-brand' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
