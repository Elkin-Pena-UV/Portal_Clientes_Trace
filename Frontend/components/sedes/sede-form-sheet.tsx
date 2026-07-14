'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { Sede, TipoPunto } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  tipo: TipoPunto | ''
  direccion: string
  ciudad: string
  contactoNombre: string
  contactoTelefono: string
}

const emptyForm: FormState = {
  nombre: '',
  tipo: '',
  direccion: '',
  ciudad: '',
  contactoNombre: '',
  contactoTelefono: '',
}

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
              tipo: sede.tipo,
              direccion: sede.direccion,
              ciudad: sede.ciudad,
              contactoNombre: sede.contactoNombre ?? '',
              contactoTelefono: sede.contactoTelefono ?? '',
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
    if (!form.tipo) next.tipo = 'Selecciona el tipo de punto.'
    if (!form.direccion.trim()) next.direccion = 'Ingresa la dirección.'
    if (!form.ciudad.trim()) next.ciudad = 'Ingresa la ciudad.'
    if (form.contactoTelefono && !/^\d{7,10}$/.test(form.contactoTelefono.trim()))
      next.contactoTelefono = 'Teléfono inválido (7 a 10 dígitos).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo as TipoPunto,
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      contactoNombre: form.contactoNombre.trim() || undefined,
      contactoTelefono: form.contactoTelefono.trim() || undefined,
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
              ? 'Actualiza la información del punto.'
              : 'Registra un punto de entrega o retiro disponible para tus pedidos.'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="sede-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-2"
        >
          <FieldGroup>
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="nombre">Nombre de la sede</FieldLabel>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Ej: Obra Torre Central"
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <FieldError>{errors.nombre}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.tipo}>
              <FieldLabel htmlFor="tipo">Tipo de punto</FieldLabel>
              <Select
                value={form.tipo || undefined}
                onValueChange={(v) => set('tipo', v as TipoPunto)}
              >
                <SelectTrigger id="tipo" aria-invalid={!!errors.tipo}>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="obra">Obra</SelectItem>
                    <SelectItem value="punto_venta">Punto de venta</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.tipo && <FieldError>{errors.tipo}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.direccion}>
              <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(e) => set('direccion', e.target.value)}
                placeholder="Ej: Cra 45 # 26-85"
                aria-invalid={!!errors.direccion}
              />
              {errors.direccion && <FieldError>{errors.direccion}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.ciudad}>
              <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
              <Input
                id="ciudad"
                value={form.ciudad}
                onChange={(e) => set('ciudad', e.target.value)}
                placeholder="Ej: Bogotá"
                aria-invalid={!!errors.ciudad}
              />
              {errors.ciudad && <FieldError>{errors.ciudad}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="contactoNombre">
                Nombre de contacto (opcional)
              </FieldLabel>
              <Input
                id="contactoNombre"
                value={form.contactoNombre}
                onChange={(e) => set('contactoNombre', e.target.value)}
                placeholder="Ej: Ing. Marcela Ríos"
              />
            </Field>

            <Field data-invalid={!!errors.contactoTelefono}>
              <FieldLabel htmlFor="contactoTelefono">
                Teléfono de contacto (opcional)
              </FieldLabel>
              <Input
                id="contactoTelefono"
                inputMode="numeric"
                value={form.contactoTelefono}
                onChange={(e) =>
                  set('contactoTelefono', e.target.value.replace(/\D/g, ''))
                }
                placeholder="Ej: 3104567890"
                aria-invalid={!!errors.contactoTelefono}
              />
              {errors.contactoTelefono ? (
                <FieldError>{errors.contactoTelefono}</FieldError>
              ) : (
                <FieldDescription>Solo números, sin espacios.</FieldDescription>
              )}
            </Field>
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
