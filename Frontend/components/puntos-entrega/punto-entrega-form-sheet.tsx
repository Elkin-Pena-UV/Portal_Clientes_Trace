'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { PuntoEntrega, TipoPunto } from '@/lib/types'
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

interface PuntoEntregaFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  punto?: PuntoEntrega | null
  /** Sede de despacho pre-seleccionada (flujo "agregar desde el pedido"). */
  sedeDespachoInicial?: string
}

interface FormState {
  nombre: string
  tipo: TipoPunto | ''
  sedeDespachoId: string
  direccion: string
  ciudad: string
  contactoNombre: string
  contactoTelefono: string
}

const emptyForm: FormState = {
  nombre: '',
  tipo: '',
  sedeDespachoId: '',
  direccion: '',
  ciudad: '',
  contactoNombre: '',
  contactoTelefono: '',
}

export function PuntoEntregaFormSheet({
  open,
  onOpenChange,
  punto,
  sedeDespachoInicial,
}: PuntoEntregaFormSheetProps) {
  const { sedes, addPuntoEntrega, updatePuntoEntrega } = usePortal()
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // `items` permite que el trigger de los selects muestre el label, no el value.
  const tipoItems = React.useMemo(
    () => [
      { value: 'obra', label: 'Obra' },
      { value: 'punto_venta', label: 'Punto de venta' },
    ],
    [],
  )
  const sedeItems = React.useMemo(
    () =>
      sedes
        .filter((s) => s.activa)
        .map((s) => ({ value: s.id, label: s.nombre })),
    [sedes],
  )

  React.useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        punto
          ? {
              nombre: punto.nombre,
              tipo: punto.tipo,
              sedeDespachoId: punto.sedeDespachoId,
              direccion: punto.direccion,
              ciudad: punto.ciudad,
              contactoNombre: punto.contactoNombre ?? '',
              contactoTelefono: punto.contactoTelefono ?? '',
            }
          : { ...emptyForm, sedeDespachoId: sedeDespachoInicial ?? '' },
      )
    }
  }, [open, punto, sedeDespachoInicial])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.nombre.trim()) next.nombre = 'Ingresa el nombre del punto.'
    if (!form.tipo) next.tipo = 'Selecciona el tipo de punto.'
    if (!form.sedeDespachoId)
      next.sedeDespachoId = 'Selecciona la sede de despacho.'
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
      sedeDespachoId: form.sedeDespachoId,
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      contactoNombre: form.contactoNombre.trim() || undefined,
      contactoTelefono: form.contactoTelefono.trim() || undefined,
    }
    if (punto) {
      updatePuntoEntrega(punto.id, payload)
      toast.success('Punto de entrega actualizado correctamente.')
    } else {
      addPuntoEntrega(payload)
      toast.success('Punto de entrega creado correctamente.')
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {punto ? 'Editar punto de entrega' : 'Nuevo punto de entrega'}
          </SheetTitle>
          <SheetDescription>
            {punto
              ? 'Actualiza la información del punto.'
              : 'Registra un punto de entrega o retiro disponible para tus pedidos.'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="punto-entrega-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-2"
        >
          <FieldGroup>
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="nombre">Nombre del punto</FieldLabel>
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
                items={tipoItems}
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

            <Field data-invalid={!!errors.sedeDespachoId}>
              <FieldLabel htmlFor="sedeDespacho">Sede de despacho</FieldLabel>
              <Select
                items={sedeItems}
                value={form.sedeDespachoId || undefined}
                onValueChange={(v) => set('sedeDespachoId', v ?? '')}
              >
                <SelectTrigger
                  id="sedeDespacho"
                  aria-invalid={!!errors.sedeDespachoId}
                >
                  <SelectValue placeholder="Selecciona la sede de despacho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sedes
                      .filter((s) => s.activa)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.sedeDespachoId ? (
                <FieldError>{errors.sedeDespachoId}</FieldError>
              ) : (
                <FieldDescription>
                  Planta desde la que se despacharán los pedidos hacia este punto.
                </FieldDescription>
              )}
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
          <Button type="submit" form="punto-entrega-form">
            {punto ? 'Guardar cambios' : 'Crear punto'}
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
