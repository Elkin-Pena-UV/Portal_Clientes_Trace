'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RadioCardOption<T extends string> {
  value: T
  title: string
  description: string
  icon: LucideIcon
}

interface RadioCardsProps<T extends string> {
  label: string
  options: RadioCardOption<T>[]
  value: T | null
  onChange: (value: T) => void
}

export function RadioCards<T extends string>({
  label,
  options,
  value,
  onChange,
}: RadioCardsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-3 sm:grid-cols-2"
    >
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all outline-none',
              'hover:border-primary/60 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50',
              selected
                ? 'border-primary ring-[3px] ring-primary/20'
                : 'border-border',
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-md transition-colors',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium leading-tight">{option.title}</span>
              <span className="text-sm text-muted-foreground text-pretty">
                {option.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
