'use client'

import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentStepperProps {
  currentStep: 1 | 2 | 3
  steps: { icon: LucideIcon; label: string }[]
}

export function PaymentStepper({ currentStep, steps }: PaymentStepperProps) {
  return (
    <div className="mb-8 flex justify-center w-full px-4">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const status =
            stepNumber < currentStep ? 'complete' : stepNumber === currentStep ? 'current' : 'pending'
          const IconComponent = step.icon

          return (
            <div key={step.label} className="flex items-center">
              {/* Step circle with label */}
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    status === 'complete' && 'border-[#ff6600] bg-[#ff6600] text-white',
                    status === 'current' && 'border-[#00359a] text-[#00359a]',
                    status === 'pending' && 'border-gray-300 text-gray-300',
                  )}
                >
                  {status === 'complete' ? (
                    <Check className="size-5" />
                  ) : (
                    <IconComponent className="size-5" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs md:text-sm whitespace-nowrap font-medium',
                    status === 'pending'
                      ? 'text-gray-400'
                      : status === 'current'
                        ? 'text-[#00359a] font-semibold'
                        : 'text-gray-600',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line (hidden after last step) */}
              {stepNumber < steps.length && (
                <div
                  className={cn(
                    'h-0.5 w-8 sm:w-16 md:w-24 lg:w-32 mx-1 sm:mx-2 md:mx-3 lg:mx-4 -mt-8 transition-colors',
                    stepNumber < currentStep ? 'bg-[#ff6600]' : 'bg-gray-300',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
