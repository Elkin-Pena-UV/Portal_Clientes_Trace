'use client'

import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatFecha, parseFechaISO, toFechaISO } from '@/lib/format'
import { hoyInicio } from '@/lib/order-utils'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string | null
  onChange: (iso: string) => void
  /** Resalta el borde en naranja cuando es obligatorio y está vacío. */
  invalid?: boolean
  id?: string
  /** Variante reducida para usar dentro de una fila. */
  compact?: boolean
  /** Texto a mostrar cuando no hay fecha seleccionada. */
  placeholder?: string
}

export function DatePicker({
  value,
  onChange,
  invalid,
  id,
  compact,
  placeholder = 'Seleccionar fecha',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            aria-invalid={invalid}
            className={cn(
              'justify-start font-normal',
              compact ? 'h-9' : 'w-full',
              !value && 'text-muted-foreground',
              invalid && 'border-primary ring-2 ring-primary/20',
            )}
          />
        }
      >
        <CalendarDays
          className={cn('size-4 shrink-0', invalid && 'text-primary')}
        />
        {value ? formatFecha(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseFechaISO(value) : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(toFechaISO(date))
              setOpen(false)
            }
          }}
          disabled={{ before: hoyInicio() }}
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
