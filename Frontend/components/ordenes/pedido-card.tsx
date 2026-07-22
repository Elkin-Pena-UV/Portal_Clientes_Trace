'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Hand,
  Layers,
  Package,
  PackagePlus,
  Pencil,
  Trash2,
  Truck,
} from 'lucide-react'
import type {
  ContactoEntrega,
  ContactoRetira,
  DatosDespacho,
  ItemPedido,
  Pedido,
  TipoProducto,
} from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { despachoCompleto, fechasCompletas, totalUnidades } from '@/lib/order-utils'
import { RadioCards } from '@/components/ordenes/radio-cards'
import { SedeCombobox } from '@/components/ordenes/sede-combobox'
import { PuntoEntregaCombobox } from '@/components/ordenes/punto-entrega-combobox'
import { ProductPickerDialog } from '@/components/ordenes/product-picker-dialog'
import { ProductLine } from '@/components/ordenes/product-line'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface PedidoCardProps {
  pedido: Pedido
  index: number
  isOpen: boolean
  onToggle: () => void
  onChange: (pedido: Pedido) => void
  onRemove: (() => void) | null
  showErrors: boolean
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-destructive">{children}</p>
}

/** Radio Sí/No horizontal para los servicios adicionales (estiba/descarga). */
function SiNoField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={value ? 'si' : 'no'}
        onValueChange={(v) => onChange(v === 'si')}
        className="flex items-center gap-4"
      >
        <span className="flex items-center gap-2">
          <RadioGroupItem value="si" id={`${id}-si`} />
          <Label htmlFor={`${id}-si`} className="cursor-pointer font-normal">
            Sí
          </Label>
        </span>
        <span className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="cursor-pointer font-normal">
            No
          </Label>
        </span>
      </RadioGroup>
    </div>
  )
}

function StepHeading({
  step,
  title,
}: {
  step: number
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
        {step}
      </span>
      <h4 className="text-sm font-semibold text-brand">{title}</h4>
    </div>
  )
}

export function PedidoCard({
  pedido,
  index,
  isOpen,
  onToggle,
  onChange,
  onRemove,
  showErrors,
}: PedidoCardProps) {
  const { getProducto } = usePortal()
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const completo =
    pedido.tipoProducto !== null &&
    pedido.metodoDespacho !== null &&
    despachoCompleto(pedido) &&
    pedido.items.length > 0

  function setTipo(tipo: TipoProducto) {
    // Cambiar tipo limpia los productos (son distintos según tipo)
    onChange({
      ...pedido,
      tipoProducto: tipo,
      items: pedido.tipoProducto === tipo ? pedido.items : [],
    })
  }

  function setMetodo(metodo: 'entregar' | 'retira') {
    onChange({
      ...pedido,
      metodoDespacho: metodo,
      // La descarga solo aplica a 'entregar': al pasar a Retira se fuerza off.
      despacho:
        metodo === 'retira'
          ? { ...pedido.despacho, necesitaDescarga: false }
          : pedido.despacho,
    })
  }

  function setDespacho(patch: Partial<DatosDespacho>) {
    onChange({ ...pedido, despacho: { ...pedido.despacho, ...patch } })
  }

  function setContactoEntrega(patch: Partial<ContactoEntrega>) {
    onChange({
      ...pedido,
      contactoEntrega: { ...pedido.contactoEntrega, ...patch },
    })
  }

  function setContactoRetira(patch: Partial<ContactoRetira>) {
    onChange({
      ...pedido,
      contactoRetira: { ...pedido.contactoRetira, ...patch },
    })
  }

  function setItems(items: ItemPedido[]) {
    onChange({ ...pedido, items })
  }

  function updateItemQty(itemId: string, cantidad: number) {
    if (cantidad <= 0) {
      setItems(pedido.items.filter((i) => i.id !== itemId))
    } else {
      setItems(
        pedido.items.map((i) => (i.id === itemId ? { ...i, cantidad } : i)),
      )
    }
  }

  function updateItemFecha(itemId: string, fechaEntrega: string) {
    setItems(
      pedido.items.map((i) => (i.id === itemId ? { ...i, fechaEntrega } : i)),
    )
  }

  const faltanFechas = pedido.items.length > 0 && !fechasCompletas(pedido)

  const unidades = totalUnidades(pedido)
  const d = pedido.despacho
  const ce = pedido.contactoEntrega
  const cr = pedido.contactoRetira
  const entregar = pedido.metodoDespacho === 'entregar'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card transition-colors',
        isOpen ? 'border-primary/40' : 'border-border',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left outline-none"
          aria-expanded={isOpen}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold',
              completo
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {completo ? <CheckCircle2 className="size-5" /> : index + 1}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-semibold">Pedido {index + 1}</span>
            <span className="truncate text-xs text-muted-foreground">
              {pedido.tipoProducto
                ? pedido.tipoProducto === 'saco'
                  ? 'Productos ensacados'
                  : 'Cemento a granel'
                : 'Sin configurar'}
              {unidades > 0 ? ` · ${unidades} und.` : ''}
            </span>
          </span>
        </button>
        {pedido.items.length > 0 && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {pedido.items.length} prod.
          </Badge>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Eliminar Pedido ${index + 1}`}
          >
            <Trash2 className="text-destructive" />
          </Button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Contraer pedido' : 'Expandir pedido'}
        >
          <ChevronDown
            className={cn(
              'size-5 text-muted-foreground transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-6 border-t p-4 sm:p-5">
          {/* Step 1 — Tipo de producto */}
          <section className="flex flex-col gap-3">
            <StepHeading step={1} title="Tipo de producto" />
            <RadioCards<TipoProducto>
              label="Tipo de producto"
              value={pedido.tipoProducto}
              onChange={setTipo}
              options={[
                {
                  value: 'saco',
                  title: 'Productos ensacados',
                  description: 'Cementos y línea de acabados en sacos.',
                  icon: Package,
                },
                {
                  value: 'granel',
                  title: 'Cemento a granel',
                  description: 'Despacho en volumen, sin empaque.',
                  icon: Boxes,
                },
              ]}
            />
            {showErrors && pedido.tipoProducto === null && (
              <FieldError>Selecciona un tipo de producto.</FieldError>
            )}
          </section>

          {/* Step 2 — Método de despacho */}
          <section className="flex flex-col gap-3">
            <StepHeading step={2} title="Método de despacho" />
            <RadioCards<'entregar' | 'retira'>
              label="Método de despacho"
              value={pedido.metodoDespacho}
              onChange={setMetodo}
              options={[
                {
                  value: 'entregar',
                  title: 'Entregar',
                  description: 'La empresa entrega en el punto indicado.',
                  icon: Truck,
                },
                {
                  value: 'retira',
                  title: 'Retira',
                  description: 'El cliente recoge en el punto.',
                  icon: Hand,
                },
              ]}
            />
            {showErrors && pedido.metodoDespacho === null && (
              <FieldError>Selecciona un método de despacho.</FieldError>
            )}

            {/* Formulario de despacho: bloque común + contacto según método.
                El bloque común NO se remonta al alternar Entregar/Retira; solo
                el bloque de contacto se intercambia (y lleva la animación). */}
            {pedido.metodoDespacho !== null && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <FieldGroup>
                  <Field
                    data-invalid={showErrors && !d.sedeId}
                    className="@container/field"
                  >
                    <FieldLabel>Sede</FieldLabel>
                    <SedeCombobox
                      value={d.sedeId}
                      onChange={(v) => {
                        // Cambiar de sede invalida el punto elegido (cascada).
                        if (v !== d.sedeId) {
                          setDespacho({ sedeId: v, puntoEntregaId: '' })
                        }
                      }}
                      invalid={showErrors && !d.sedeId}
                      placeholder="Selecciona la sede de despacho"
                    />
                    {showErrors && !d.sedeId && (
                      <FieldError>Selecciona una sede.</FieldError>
                    )}
                  </Field>

                  <Field
                    data-invalid={showErrors && !d.puntoEntregaId}
                    className="@container/field"
                  >
                    <FieldLabel>
                      {entregar ? 'Punto de entrega' : 'Punto de retiro'}
                    </FieldLabel>
                    <PuntoEntregaCombobox
                      value={d.puntoEntregaId}
                      onChange={(v) => setDespacho({ puntoEntregaId: v })}
                      sedeId={d.sedeId || null}
                      disabled={!d.sedeId}
                      invalid={showErrors && !d.puntoEntregaId}
                      placeholder={
                        d.sedeId
                          ? entregar
                            ? 'Selecciona el punto de entrega'
                            : 'Selecciona el punto de retiro'
                          : 'Primero selecciona una sede'
                      }
                    />
                    {showErrors && !d.puntoEntregaId && (
                      <FieldError>
                        {entregar
                          ? 'Selecciona un punto de entrega.'
                          : 'Selecciona un punto de retiro.'}
                      </FieldError>
                    )}
                  </Field>

                  <Field data-invalid={showErrors && !d.ordenCompra.trim()}>
                    <FieldLabel htmlFor={`oc-${pedido.id}`}>
                      Orden de compra
                    </FieldLabel>
                    <Input
                      id={`oc-${pedido.id}`}
                      value={d.ordenCompra}
                      onChange={(ev) =>
                        setDespacho({
                          ordenCompra: ev.target.value.slice(0, 15),
                        })
                      }
                      aria-invalid={showErrors && !d.ordenCompra.trim()}
                      placeholder="Ej: 254701"
                    />
                    {showErrors && !d.ordenCompra.trim() && (
                      <FieldError>Ingresa la orden de compra.</FieldError>
                    )}
                  </Field>

                  {/* Servicios adicionales: la nota vive dentro del grupo. */}
                  <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
                    <Label className="text-sm font-medium">
                      Servicios adicionales
                    </Label>
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <SiNoField
                        id={`estiba-${pedido.id}`}
                        label="¿Requiere estiba?"
                        value={d.necesitaEstiba}
                        onChange={(v) => setDespacho({ necesitaEstiba: v })}
                      />
                      {/* La descarga solo aplica a 'entregar'. */}
                      {entregar && (
                        <SiNoField
                          id={`descarga-${pedido.id}`}
                          label="¿Requiere descarga?"
                          value={d.necesitaDescarga}
                          onChange={(v) => setDespacho({ necesitaDescarga: v })}
                        />
                      )}
                    </div>
                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertTriangle
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      Estos servicios generan un costo adicional en la factura.
                    </p>
                  </fieldset>

                  <Field>
                    <FieldLabel htmlFor={`obs-${pedido.id}`}>
                      Observaciones (opcional)
                    </FieldLabel>
                    <Textarea
                      id={`obs-${pedido.id}`}
                      value={d.observaciones}
                      onChange={(ev) =>
                        setDespacho({ observaciones: ev.target.value })
                      }
                      placeholder={
                        entregar
                          ? 'Indicaciones adicionales para la entrega...'
                          : 'Indicaciones adicionales para el retiro...'
                      }
                      rows={3}
                    />
                  </Field>

                  {/* Bloque de contacto: lo ÚNICO que cambia con el método. */}
                  {entregar ? (
                    <div
                      key="contacto-entrega"
                      className="animate-in fade-in-0 slide-in-from-top-2 flex flex-col gap-4 duration-300"
                    >
                      <h5 className="text-sm font-semibold text-brand">
                        Datos de quien recibe
                      </h5>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field data-invalid={showErrors && !ce.nombreRecibe.trim()}>
                          <FieldLabel htmlFor={`recibe-${pedido.id}`}>
                            Nombre de quien recibe
                          </FieldLabel>
                          <Input
                            id={`recibe-${pedido.id}`}
                            value={ce.nombreRecibe}
                            onChange={(ev) =>
                              setContactoEntrega({ nombreRecibe: ev.target.value })
                            }
                            aria-invalid={showErrors && !ce.nombreRecibe.trim()}
                            placeholder="Nombre completo"
                          />
                          {showErrors && !ce.nombreRecibe.trim() && (
                            <FieldError>Ingresa el nombre.</FieldError>
                          )}
                        </Field>

                        <Field
                          data-invalid={showErrors && !/^\d{10}$/.test(ce.celular)}
                        >
                          <FieldLabel htmlFor={`cel-e-${pedido.id}`}>
                            Celular
                          </FieldLabel>
                          <Input
                            id={`cel-e-${pedido.id}`}
                            inputMode="numeric"
                            value={ce.celular}
                            onChange={(ev) =>
                              setContactoEntrega({
                                celular: ev.target.value.replace(/\D/g, '').slice(0, 10),
                              })
                            }
                            aria-invalid={showErrors && !/^\d{10}$/.test(ce.celular)}
                            placeholder="3001234567"
                          />
                          {showErrors && !/^\d{10}$/.test(ce.celular) && (
                            <FieldError>Celular de 10 dígitos.</FieldError>
                          )}
                        </Field>
                      </div>

                      <Field
                        data-invalid={
                          showErrors &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ce.correo)
                        }
                      >
                        <FieldLabel htmlFor={`correo-${pedido.id}`}>
                          Correo electrónico
                        </FieldLabel>
                        <Input
                          id={`correo-${pedido.id}`}
                          type="email"
                          value={ce.correo}
                          onChange={(ev) =>
                            setContactoEntrega({ correo: ev.target.value })
                          }
                          aria-invalid={
                            showErrors &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ce.correo)
                          }
                          placeholder="correo@empresa.com"
                        />
                        {showErrors &&
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ce.correo) && (
                            <FieldError>Ingresa un correo válido.</FieldError>
                          )}
                      </Field>
                    </div>
                  ) : (
                    <div
                      key="contacto-retira"
                      className="animate-in fade-in-0 slide-in-from-top-2 flex flex-col gap-4 duration-300"
                    >
                      <h5 className="text-sm font-semibold text-brand">
                        Datos del conductor
                      </h5>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          data-invalid={showErrors && !cr.nombreConductor.trim()}
                        >
                          <FieldLabel htmlFor={`cond-${pedido.id}`}>
                            Nombre del conductor
                          </FieldLabel>
                          <Input
                            id={`cond-${pedido.id}`}
                            value={cr.nombreConductor}
                            onChange={(ev) =>
                              setContactoRetira({
                                nombreConductor: ev.target.value,
                              })
                            }
                            aria-invalid={showErrors && !cr.nombreConductor.trim()}
                            placeholder="Nombre completo"
                          />
                          {showErrors && !cr.nombreConductor.trim() && (
                            <FieldError>Ingresa el nombre.</FieldError>
                          )}
                        </Field>

                        <Field
                          data-invalid={showErrors && !/^\d{6,10}$/.test(cr.cedula)}
                        >
                          <FieldLabel htmlFor={`cc-${pedido.id}`}>
                            Cédula (CC)
                          </FieldLabel>
                          <Input
                            id={`cc-${pedido.id}`}
                            inputMode="numeric"
                            value={cr.cedula}
                            onChange={(ev) =>
                              setContactoRetira({
                                cedula: ev.target.value.replace(/\D/g, '').slice(0, 10),
                              })
                            }
                            aria-invalid={showErrors && !/^\d{6,10}$/.test(cr.cedula)}
                            placeholder="Número de cédula"
                          />
                          {showErrors && !/^\d{6,10}$/.test(cr.cedula) && (
                            <FieldError>Cédula inválida.</FieldError>
                          )}
                        </Field>

                        <Field
                          data-invalid={
                            showErrors && !/^[A-Z]{3}\d{3}$/.test(cr.placa)
                          }
                        >
                          <FieldLabel htmlFor={`placa-${pedido.id}`}>
                            Placa del vehículo
                          </FieldLabel>
                          <Input
                            id={`placa-${pedido.id}`}
                            value={cr.placa}
                            onChange={(ev) =>
                              setContactoRetira({
                                placa: ev.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, '')
                                  .slice(0, 6),
                              })
                            }
                            aria-invalid={
                              showErrors && !/^[A-Z]{3}\d{3}$/.test(cr.placa)
                            }
                            placeholder="ABC123"
                            className="uppercase"
                          />
                          {showErrors && !/^[A-Z]{3}\d{3}$/.test(cr.placa) ? (
                            <FieldError>Formato de placa: ABC123.</FieldError>
                          ) : (
                            <FieldDescription>
                              3 letras y 3 números.
                            </FieldDescription>
                          )}
                        </Field>

                        <Field
                          data-invalid={showErrors && !/^\d{10}$/.test(cr.celular)}
                        >
                          <FieldLabel htmlFor={`cel-r-${pedido.id}`}>
                            Celular
                          </FieldLabel>
                          <Input
                            id={`cel-r-${pedido.id}`}
                            inputMode="numeric"
                            value={cr.celular}
                            onChange={(ev) =>
                              setContactoRetira({
                                celular: ev.target.value.replace(/\D/g, '').slice(0, 10),
                              })
                            }
                            aria-invalid={showErrors && !/^\d{10}$/.test(cr.celular)}
                            placeholder="3001234567"
                          />
                          {showErrors && !/^\d{10}$/.test(cr.celular) && (
                            <FieldError>Celular de 10 dígitos.</FieldError>
                          )}
                        </Field>
                      </div>
                    </div>
                  )}
                </FieldGroup>
              </div>
            )}
          </section>

          {/* Step 3 — Productos */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <StepHeading step={3} title="Productos" />
              {unidades > 0 && (
                <Badge className="gap-1">
                  <Layers className="size-3" />
                  {unidades} und.
                </Badge>
              )}
            </div>

            {pedido.tipoProducto === null ? (
              <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                Primero selecciona un tipo de producto para poder agregar
                artículos.
              </p>
            ) : pedido.items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aún no has agregado productos a este pedido.
                </p>
                <Button type="button" onClick={() => setPickerOpen(true)}>
                  <PackagePlus data-icon="inline-start" />
                  Agregar productos
                </Button>
                {showErrors && (
                  <FieldError>Agrega al menos un producto.</FieldError>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pedido.items.map((item) => {
                  const producto = getProducto(item.productoId)
                  if (!producto) return null
                  return (
                    <ProductLine
                      key={item.id}
                      producto={producto}
                      item={item}
                      onQtyChange={updateItemQty}
                      onFechaChange={updateItemFecha}
                      showErrors={showErrors}
                    />
                  )
                })}
                {showErrors && faltanFechas && (
                  <p className="text-sm font-medium text-destructive">
                    Asigna una fecha de entrega a todos los productos.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                  className="mt-1 self-start"
                >
                  <Pencil data-icon="inline-start" />
                  Editar productos
                </Button>
              </div>
            )}
          </section>

          {pedido.tipoProducto !== null && (
            <ProductPickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              tipoProducto={pedido.tipoProducto}
              currentItems={pedido.items}
              onConfirm={setItems}
            />
          )}
        </div>
      )}
    </div>
  )
}
