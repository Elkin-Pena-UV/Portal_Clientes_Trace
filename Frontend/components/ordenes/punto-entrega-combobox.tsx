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

interface PuntoEntregaComboboxProps {
  value: string
  onChange: (value: string) => void
  /**
   * Filtro en cascada: solo lista los puntos cuya sedeDespachoId coincida.
   * Sin filtro (null/undefined) lista el catálogo completo.
   */
  sedeId?: string | null
  disabled?: boolean
  placeholder?: string
  invalid?: boolean
  id?: string
  allowCreate?: boolean
}

/** Combobox de Puntos de entrega del cliente, con filtro opcional por Sede. */
export function PuntoEntregaCombobox({
  value,
  onChange,
  sedeId,
  disabled = false,
  placeholder = 'Selecciona el punto de entrega',
  invalid,
  id,
  allowCreate = true,
}: PuntoEntregaComboboxProps) {
  const { puntosEntrega, solicitarCrearPuntoEntrega } = usePortal()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const listado = sedeId
    ? puntosEntrega.filter((p) => p.sedeDespachoId === sedeId)
    : puntosEntrega
  const selected = puntosEntrega.find((p) => p.id === value)

  const direccionCompleta = selected
    ? [selected.direccion, selected.ciudad].filter(Boolean).join(', ')
    : ''

  function handleAgregarPunto() {
    setOpen(false)
    // Marca que al volver se debe restaurar el borrador y abrir el formulario
    // de punto de entrega con la sede pre-seleccionada.
    solicitarCrearPuntoEntrega(sedeId ?? '')
    router.push('/puntos-entrega')
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
              disabled={disabled}
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
                <span className="text-muted-foreground">
                  · {selected.ciudad}
                </span>
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar punto de entrega..." />
            <CommandList>
              <CommandEmpty>
                <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  No hay puntos de entrega para esta búsqueda.
                </span>
              </CommandEmpty>
              <CommandGroup>
                {listado.map((punto) => (
                  <CommandItem
                    key={punto.id}
                    value={`${punto.nombre} ${punto.ciudad}`}
                    onSelect={() => {
                      onChange(punto.id)
                      setOpen(false)
                    }}
                    className="gap-2"
                  >
                    {punto.tipo === 'obra' ? (
                      <Building2 className="size-4 text-muted-foreground" />
                    ) : (
                      <Store className="size-4 text-muted-foreground" />
                    )}
                    <span className="flex flex-col">
                      <span className="font-medium">{punto.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {punto.direccion} · {punto.ciudad}
                      </span>
                    </span>
                    <Check
                      className={cn(
                        'ml-auto size-4',
                        value === punto.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {allowCreate && (
              <button
                type="button"
                onClick={handleAgregarPunto}
                className="flex w-full items-center gap-2 border-t bg-[#ff6600]/10 px-3 py-2.5 text-left text-sm font-medium text-[#ff6600] outline-none transition-colors hover:bg-[#ff6600]/20 focus-visible:bg-[#ff6600]/20"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#ff6600]/15">
                  <Plus className="size-3.5" />
                </span>
                Agregar nuevo punto de entrega
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
