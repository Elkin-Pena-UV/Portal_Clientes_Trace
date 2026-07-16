'use client'

import * as React from 'react'
import {
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
  DatosEntrega,
  DatosRetira,
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
import { Switch } from '@/components/ui/switch'
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
    onChange({ ...pedido, metodoDespacho: metodo })
  }

  function setEntrega(patch: Partial<DatosEntrega>) {
    onChange({ ...pedido, datosEntrega: { ...pedido.datosEntrega, ...patch } })
  }

  function setRetira(patch: Partial<DatosRetira>) {
    onChange({ ...pedido, datosRetira: { ...pedido.datosRetira, ...patch } })
  }

  function setItems(items: ItemPedido[]) {
    onChange({ ...pedido, items })
  }

  function updateItemQty(productoId: string, cantidad: number) {
    if (cantidad <= 0) {
      setItems(pedido.items.filter((i) => i.productoId !== productoId))
    } else {
      setItems(
        pedido.items.map((i) =>
          i.productoId === productoId ? { ...i, cantidad } : i,
        ),
      )
    }
  }

  function updateItemFecha(productoId: string, fechaEntrega: string) {
    setItems(
      pedido.items.map((i) =>
        i.productoId === productoId ? { ...i, fechaEntrega } : i,
      ),
    )
  }

  const faltanFechas = pedido.items.length > 0 && !fechasCompletas(pedido)

  const unidades = totalUnidades(pedido)
  const e = pedido.datosEntrega
  const r = pedido.datosRetira

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

            {/* Formulario dinámico Entregar */}
            {pedido.metodoDespacho === 'entregar' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 rounded-lg border bg-muted/30 p-4 duration-300">
                <FieldGroup>
                  <Field
                    data-invalid={showErrors && !e.sedeDespachoId}
                    className="@container/field"
                  >
                    <FieldLabel>Sede</FieldLabel>
                    <SedeCombobox
                      value={e.sedeDespachoId}
                      onChange={(v) => {
                        // Cambiar de sede invalida el punto elegido (cascada).
                        if (v !== e.sedeDespachoId) {
                          setEntrega({ sedeDespachoId: v, puntoEntregaId: '' })
                        }
                      }}
                      invalid={showErrors && !e.sedeDespachoId}
                      placeholder="Selecciona la sede de despacho"
                    />
                    {showErrors && !e.sedeDespachoId && (
                      <FieldError>Selecciona una sede.</FieldError>
                    )}
                  </Field>

                  <Field
                    data-invalid={showErrors && !e.puntoEntregaId}
                    className="@container/field"
                  >
                    <FieldLabel>Punto de entrega</FieldLabel>
                    <PuntoEntregaCombobox
                      value={e.puntoEntregaId}
                      onChange={(v) => setEntrega({ puntoEntregaId: v })}
                      sedeId={e.sedeDespachoId || null}
                      disabled={!e.sedeDespachoId}
                      invalid={showErrors && !e.puntoEntregaId}
                      placeholder={
                        e.sedeDespachoId
                          ? 'Selecciona el punto de entrega'
                          : 'Primero selecciona una sede'
                      }
                    />
                    {showErrors && !e.puntoEntregaId && (
                      <FieldError>Selecciona un punto de entrega.</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={showErrors && !e.ordenCompra.trim()}>
                    <FieldLabel htmlFor={`oc-e-${pedido.id}`}>
                      Orden de compra
                    </FieldLabel>
                    <Input
                      id={`oc-e-${pedido.id}`}
                      value={e.ordenCompra}
                      onChange={(ev) =>
                        setEntrega({ 
                          ordenCompra: ev.target.value.replace(/\D/g, '').slice(0, 15)
                        })
                      }
                      aria-invalid={showErrors && !e.ordenCompra.trim()}
                      placeholder="Ej: 254701"
                    />
                    {showErrors && !e.ordenCompra.trim() && (
                      <FieldError>Ingresa la orden de compra.</FieldError>
                    )}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={showErrors && !e.nombreRecibe.trim()}>
                      <FieldLabel htmlFor={`recibe-${pedido.id}`}>
                        Nombre de quien recibe
                      </FieldLabel>
                      <Input
                        id={`recibe-${pedido.id}`}
                        value={e.nombreRecibe}
                        onChange={(ev) =>
                          setEntrega({ nombreRecibe: ev.target.value })
                        }
                        aria-invalid={showErrors && !e.nombreRecibe.trim()}
                        placeholder="Nombre completo"
                      />
                      {showErrors && !e.nombreRecibe.trim() && (
                        <FieldError>Ingresa el nombre.</FieldError>
                      )}
                    </Field>

                    <Field data-invalid={showErrors && !/^\d{10}$/.test(e.celular)}>
                      <FieldLabel htmlFor={`cel-e-${pedido.id}`}>
                        Celular
                      </FieldLabel>
                      <Input
                        id={`cel-e-${pedido.id}`}
                        inputMode="numeric"
                        value={e.celular}
                        onChange={(ev) =>
                          setEntrega({
                            celular: ev.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        aria-invalid={showErrors && !/^\d{10}$/.test(e.celular)}
                        placeholder="3001234567"
                      />
                      {showErrors && !/^\d{10}$/.test(e.celular) && (
                        <FieldError>Celular de 10 dígitos.</FieldError>
                      )}
                    </Field>
                  </div>

                  <Field
                    data-invalid={
                      showErrors &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.correo)
                    }
                  >
                    <FieldLabel htmlFor={`correo-${pedido.id}`}>
                      Correo electrónico
                    </FieldLabel>
                    <Input
                      id={`correo-${pedido.id}`}
                      type="email"
                      value={e.correo}
                      onChange={(ev) => setEntrega({ correo: ev.target.value })}
                      aria-invalid={
                        showErrors &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.correo)
                      }
                      placeholder="correo@empresa.com"
                    />
                    {showErrors &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.correo) && (
                        <FieldError>Ingresa un correo válido.</FieldError>
                      )}
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field orientation="horizontal">
                      <Switch
                        id={`estiba-e-${pedido.id}`}
                        checked={e.necesitaEstiba}
                        onCheckedChange={(c) => setEntrega({ necesitaEstiba: c })}
                      />
                      <FieldLabel htmlFor={`estiba-e-${pedido.id}`}>
                        ¿Necesita estiba?
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <Switch
                        id={`descarga-${pedido.id}`}
                        checked={e.necesitaDescarga}
                        onCheckedChange={(c) =>
                          setEntrega({ necesitaDescarga: c })
                        }
                      />
                      <FieldLabel htmlFor={`descarga-${pedido.id}`}>
                        ¿Descarga incluida?
                      </FieldLabel>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor={`obs-e-${pedido.id}`}>
                      Observaciones (opcional)
                    </FieldLabel>
                    <Textarea
                      id={`obs-e-${pedido.id}`}
                      value={e.observaciones}
                      onChange={(ev) =>
                        setEntrega({ observaciones: ev.target.value })
                      }
                      placeholder="Indicaciones adicionales para la entrega..."
                      rows={3}
                    />
                  </Field>
                </FieldGroup>
              </div>
            )}

            {/* Formulario dinámico Retira */}
            {pedido.metodoDespacho === 'retira' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 rounded-lg border bg-muted/30 p-4 duration-300">
                <FieldGroup>
                  <Field data-invalid={showErrors && !r.sedeDespachoId}>
                    <FieldLabel>Sede</FieldLabel>
                    <SedeCombobox
                      value={r.sedeDespachoId}
                      onChange={(v) => {
                        // Cambiar de sede invalida el punto elegido (cascada).
                        if (v !== r.sedeDespachoId) {
                          setRetira({ sedeDespachoId: v, puntoEntregaId: '' })
                        }
                      }}
                      invalid={showErrors && !r.sedeDespachoId}
                      placeholder="Selecciona la sede de despacho"
                    />
                    {showErrors && !r.sedeDespachoId && (
                      <FieldError>Selecciona una sede.</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={showErrors && !r.puntoEntregaId}>
                    <FieldLabel>Punto de retiro</FieldLabel>
                    <PuntoEntregaCombobox
                      value={r.puntoEntregaId}
                      onChange={(v) => setRetira({ puntoEntregaId: v })}
                      sedeId={r.sedeDespachoId || null}
                      disabled={!r.sedeDespachoId}
                      invalid={showErrors && !r.puntoEntregaId}
                      placeholder={
                        r.sedeDespachoId
                          ? 'Selecciona el punto de retiro'
                          : 'Primero selecciona una sede'
                      }
                    />
                    {showErrors && !r.puntoEntregaId && (
                      <FieldError>Selecciona un punto de retiro.</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={showErrors && !r.ordenCompra.trim()}>
                    <FieldLabel htmlFor={`oc-r-${pedido.id}`}>
                      Orden de compra
                    </FieldLabel>
                    <Input
                      id={`oc-r-${pedido.id}`}
                      value={r.ordenCompra}
                      onChange={(ev) =>
                        setRetira({ 
                          ordenCompra: ev.target.value.replace(/\D/g, '').slice(0, 15) 
                        })
                      }
                      aria-invalid={showErrors && !r.ordenCompra.trim()}
                      placeholder="Ej: 254701"
                    />
                    {showErrors && !r.ordenCompra.trim() && (
                      <FieldError>Ingresa la orden de compra.</FieldError>
                    )}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={showErrors && !r.nombreConductor.trim()}>
                      <FieldLabel htmlFor={`cond-${pedido.id}`}>
                        Nombre del conductor
                      </FieldLabel>
                      <Input
                        id={`cond-${pedido.id}`}
                        value={r.nombreConductor}
                        onChange={(ev) =>
                          setRetira({ nombreConductor: ev.target.value })
                        }
                        aria-invalid={showErrors && !r.nombreConductor.trim()}
                        placeholder="Nombre completo"
                      />
                      {showErrors && !r.nombreConductor.trim() && (
                        <FieldError>Ingresa el nombre.</FieldError>
                      )}
                    </Field>

                    <Field data-invalid={showErrors && !/^\d{6,10}$/.test(r.cedula)}>
                      <FieldLabel htmlFor={`cc-${pedido.id}`}>
                        Cédula (CC)
                      </FieldLabel>
                      <Input
                        id={`cc-${pedido.id}`}
                        inputMode="numeric"
                        value={r.cedula}
                        onChange={(ev) =>
                          setRetira({
                            cedula: ev.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        aria-invalid={showErrors && !/^\d{6,10}$/.test(r.cedula)}
                        placeholder="Número de cédula"
                      />
                      {showErrors && !/^\d{6,10}$/.test(r.cedula) && (
                        <FieldError>Cédula inválida.</FieldError>
                      )}
                    </Field>

                    <Field data-invalid={showErrors && !/^[A-Z]{3}\d{3}$/.test(r.placa)}>
                      <FieldLabel htmlFor={`placa-${pedido.id}`}>
                        Placa del vehículo
                      </FieldLabel>
                      <Input
                        id={`placa-${pedido.id}`}
                        value={r.placa}
                        onChange={(ev) =>
                          setRetira({
                            placa: ev.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, '')
                              .slice(0, 6),
                          })
                        }
                        aria-invalid={showErrors && !/^[A-Z]{3}\d{3}$/.test(r.placa)}
                        placeholder="ABC123"
                        className="uppercase"
                      />
                      {showErrors && !/^[A-Z]{3}\d{3}$/.test(r.placa) ? (
                        <FieldError>Formato de placa: ABC123.</FieldError>
                      ) : (
                        <FieldDescription>3 letras y 3 números.</FieldDescription>
                      )}
                    </Field>

                    <Field data-invalid={showErrors && !/^\d{10}$/.test(r.celular)}>
                      <FieldLabel htmlFor={`cel-r-${pedido.id}`}>
                        Celular
                      </FieldLabel>
                      <Input
                        id={`cel-r-${pedido.id}`}
                        inputMode="numeric"
                        value={r.celular}
                        onChange={(ev) =>
                          setRetira({
                            celular: ev.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        aria-invalid={showErrors && !/^\d{10}$/.test(r.celular)}
                        placeholder="3001234567"
                      />
                      {showErrors && !/^\d{10}$/.test(r.celular) && (
                        <FieldError>Celular de 10 dígitos.</FieldError>
                      )}
                    </Field>
                  </div>

                  <Field orientation="horizontal">
                    <Switch
                      id={`estiba-r-${pedido.id}`}
                      checked={r.necesitaEstiba}
                      onCheckedChange={(c) => setRetira({ necesitaEstiba: c })}
                    />
                    <FieldLabel htmlFor={`estiba-r-${pedido.id}`}>
                      ¿Necesita estiba?
                    </FieldLabel>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`obs-${pedido.id}`}>
                      Observaciones (opcional)
                    </FieldLabel>
                    <Textarea
                      id={`obs-${pedido.id}`}
                      value={r.observaciones}
                      onChange={(ev) =>
                        setRetira({ observaciones: ev.target.value })
                      }
                      placeholder="Indicaciones adicionales para el retiro..."
                      rows={3}
                    />
                  </Field>
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
                      key={item.productoId}
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
