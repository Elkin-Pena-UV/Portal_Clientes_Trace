'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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

const TODOS = 'todos'

interface ClienteComboboxProps {
  value: string
  onChange: (value: string) => void
  /** Agrega la opción "Todos los clientes" (value = 'todos') al inicio. Para filtros. */
  includeAll?: boolean
  placeholder?: string
  invalid?: boolean
  id?: string
  /** Ancho/estilos del trigger (ej. "w-52" en la barra de filtros). */
  className?: string
}

/**
 * Combobox de Clientes (terceros) con búsqueda por NOMBRE o NIT. Mismo patrón
 * que SedeCombobox. Con `includeAll` agrega "Todos los clientes" (value 'todos')
 * para usarse como filtro; sin él, selecciona un cliente concreto.
 */
export function ClienteCombobox({
  value,
  onChange,
  includeAll = false,
  placeholder = 'Buscar cliente…',
  invalid,
  id,
  className,
}: ClienteComboboxProps) {
  const { clientes } = usePortal()
  const [open, setOpen] = React.useState(false)
  const selected = clientes.find((c) => c.id === value)
  const esTodos = includeAll && value === TODOS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-invalid={invalid}
            className={cn('justify-between font-normal', className)}
          />
        }
      >
        {esTodos ? (
          <span className="truncate">Todos los clientes</span>
        ) : selected ? (
          <span className="truncate">{selected.nombre}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre o NIT…" />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>
              <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                No se encontraron clientes con ese criterio.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {includeAll && (
                <CommandItem
                  value="Todos los clientes"
                  onSelect={() => {
                    onChange(TODOS)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <span className="font-medium">Todos los clientes</span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === TODOS ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              )}
              {clientes.map((c) => (
                <CommandItem
                  key={c.id}
                  // cmdk filtra sobre este string: nombre + NIT (con y sin puntos).
                  value={`${c.nombre} ${c.nit} ${c.nit.replace(/\D/g, '')}`}
                  onSelect={() => {
                    onChange(c.id)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{c.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      NIT {c.nit}
                    </span>
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      value === c.id ? 'opacity-100' : 'opacity-0',
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
