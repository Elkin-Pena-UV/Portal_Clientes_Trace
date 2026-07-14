'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Check,
  ChevronsUpDown,
  MapPin,
  Plus,
  Store,
} from 'lucide-react'
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
  allowCreateSede?: boolean
}

export function SedeCombobox({
  value,
  onChange,
  placeholder = 'Selecciona una sede',
  invalid,
  id,
  allowCreateSede = true,
}: SedeComboboxProps) {
  const { sedes, solicitarCrearSede } = usePortal()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const selected = sedes.find((s) => s.id === value)

  const direccionCompleta = selected
    ? [selected.direccion, selected.ciudad].filter(Boolean).join(', ')
    : ''

  function handleAgregarSede() {
    setOpen(false)
    // Marca que al volver se debe restaurar el borrador y abrir el formulario de sede.
    solicitarCrearSede()
    router.push('/sedes')
  }

  return (
    <div className="flex flex-col gap-1.5">
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
            {selected.tipo === 'obra' ? (
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Store className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">
              {selected.nombre}{' '}
              <span className="text-muted-foreground">· {selected.ciudad}</span>
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar sede..." />
          <CommandList>
            <CommandEmpty>
              <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                No se encontraron sedes con ese nombre.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {sedes.map((sede) => (
                <CommandItem
                  key={sede.id}
                  value={`${sede.nombre} ${sede.ciudad}`}
                  onSelect={() => {
                    onChange(sede.id)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  {sede.tipo === 'obra' ? (
                    <Building2 className="size-4 text-muted-foreground" />
                  ) : (
                    <Store className="size-4 text-muted-foreground" />
                  )}
                  <span className="flex flex-col">
                    <span className="font-medium">{sede.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {sede.direccion} · {sede.ciudad}
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
          {/* Acción fija: solo visible si allowCreateSede es true */}
          {allowCreateSede && (
            <button
              type="button"
              onClick={handleAgregarSede}
              className="flex w-full items-center gap-2 border-t bg-[#ff6600]/10 px-3 py-2.5 text-left text-sm font-medium text-[#ff6600] outline-none transition-colors hover:bg-[#ff6600]/20 focus-visible:bg-[#ff6600]/20"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-[#ff6600]/15">
                <Plus className="size-3.5" />
              </span>
              Agregar nueva sede
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>

      {selected && direccionCompleta && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#00359a]" />
          <span className="text-pretty">{direccionCompleta}</span>
        </p>
      )}
    </div>
  )
}
