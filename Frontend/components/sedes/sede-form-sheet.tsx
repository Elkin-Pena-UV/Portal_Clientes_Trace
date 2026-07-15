'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { Sede } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface SedeFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sede?: Sede | null
}

interface FormState {
  nombre: string
  ciudad: string
  direccion: string
  activa: boolean
}

const emptyForm: FormState = {
  nombre: '',
  ciudad: '',
  direccion: '',
  activa: true,
}

/** Formulario del catálogo de Sedes (sucursales/plantas de despacho). */
export function SedeFormSheet({ open, onOpenChange, sede }: SedeFormSheetProps) {
  const { addSede, updateSede } = usePortal()
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        sede
          ? {
              nombre: sede.nombre,
              ciudad: sede.ciudad,
              direccion: sede.direccion,
              activa: sede.activa,
            }
          : emptyForm,
      )
    }
  }, [open, sede])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.nombre.trim()) next.nombre = 'Ingresa el nombre de la sede.'
    if (!form.ciudad.trim()) next.ciudad = 'Ingresa la ciudad.'
    if (!form.direccion.trim()) next.direccion = 'Ingresa la dirección.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim(),
      direccion: form.direccion.trim(),
      activa: form.activa,
    }
    if (sede) {
      updateSede(sede.id, payload)
      toast.success('Sede actualizada correctamente.')
    } else {
      addSede(payload)
      toast.success('Sede creada correctamente.')
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{sede ? 'Editar sede' : 'Nueva sede'}</SheetTitle>
          <SheetDescription>
            {sede
              ? 'Actualiza la información de la sucursal de despacho.'
              : 'Registra una sucursal/planta de despacho de la compañía.'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="sede-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-2"
        >
          <FieldGroup>
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="sede-nombre">Nombre</FieldLabel>
              <Input
                id="sede-nombre"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Ej: Cali – Planta SC"
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <FieldError>{errors.nombre}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.ciudad}>
              <FieldLabel htmlFor="sede-ciudad">Ciudad</FieldLabel>
              <Input
                id="sede-ciudad"
                value={form.ciudad}
                onChange={(e) => set('ciudad', e.target.value)}
                placeholder="Ej: Cali"
                aria-invalid={!!errors.ciudad}
              />
              {errors.ciudad && <FieldError>{errors.ciudad}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.direccion}>
              <FieldLabel htmlFor="sede-direccion">Dirección</FieldLabel>
              <Input
                id="sede-direccion"
                value={form.direccion}
                onChange={(e) => set('direccion', e.target.value)}
                placeholder="Ej: Km 24 Vía Panorama Cali – Buga"
                aria-invalid={!!errors.direccion}
              />
              {errors.direccion && <FieldError>{errors.direccion}</FieldError>}
            </Field>

            <Field orientation="horizontal">
              <Switch
                id="sede-activa"
                checked={form.activa}
                onCheckedChange={(c) => set('activa', c)}
              />
              <FieldLabel htmlFor="sede-activa">Sede activa</FieldLabel>
            </Field>
            <FieldDescription>
              Las sedes inactivas no aparecen en los selectores de pedidos.
            </FieldDescription>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button type="submit" form="sede-form">
            {sede ? 'Guardar cambios' : 'Crear sede'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-destructive">{children}</p>
}
