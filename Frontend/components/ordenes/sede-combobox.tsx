'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Factory } from 'lucide-react'
import { usePortal } from '@/components/portal-provider'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SedeComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}

/**
 * Combobox de Sedes (plantas de despacho de la compañía). Catálogo fijo:
 * sin opción de crear desde aquí. Solo lista sedes activas.
 */
export function SedeCombobox({
  value,
  onChange,
  placeholder = 'Selecciona una sede',
  invalid,
  id,
}: SedeComboboxProps) {
  const { sedes } = usePortal()
  const [open, setOpen] = React.useState(false)
  const activas = sedes.filter((s) => s.activa)
  const selected = sedes.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-invalid={invalid}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <Factory className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selected.nombre}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar sede..." />
          <CommandList>
            <CommandEmpty>
              <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                <Factory className="size-4" />
                No se encontraron sedes con ese nombre.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {activas.map((sede) => (
                <CommandItem
                  key={sede.id}
                  value={`${sede.nombre} ${sede.ciudad}`}
                  onSelect={() => {
                    onChange(sede.id)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <Factory className="size-4 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span className="font-medium">{sede.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {sede.ciudad}
                    </span>
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === sede.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
