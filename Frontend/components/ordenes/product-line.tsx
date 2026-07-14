'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { ItemPedido, Producto } from '@/lib/types'
import { calcularLinea } from '@/lib/order-utils'
import { formatCOP, formatPct } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ordenes/date-picker'
import { cn } from '@/lib/utils'

interface ProductLineProps {
  producto: Producto
  item: ItemPedido
  onQtyChange: (productoId: string, cantidad: number) => void
  onFechaChange: (productoId: string, fecha: string) => void
  showErrors: boolean
}

function DetailRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'tabular-nums',
          emphasis ? 'text-base font-bold text-brand' : 'font-medium',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function ProductLine({
  producto,
  item,
  onQtyChange,
  onFechaChange,
  showErrors,
}: ProductLineProps) {
  const [open, setOpen] = React.useState(false)
  const { neto, iva, total } = calcularLinea(producto, item.cantidad)
  const fechaFaltante = !item.fechaEntrega

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Fila colapsada */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:grid sm:grid-cols-[2fr_2fr_1fr] sm:gap-4">
        {/* Bloque izquierdo: imagen + nombre + código + unidad */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 basis-full items-center gap-3 text-left outline-none sm:basis-auto"
        >
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={producto.imagen || '/placeholder.svg'}
              alt={producto.nombre}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {producto.nombre}
              </span>
              <Badge
                variant="outline"
                className="hidden shrink-0 sm:inline-flex"
              >
                {producto.unidad}
              </Badge>
            </span>
            <span className="text-xs text-muted-foreground">
              {producto.codigo}
            </span>
          </div>
        </button>

        {/* Bloque central: cantidad + fecha (ocupa el espacio disponible) */}
        <div className="flex flex-1 items-center gap-3 sm:flex-initial sm:justify-between">
          {/* Stepper de cantidad */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onQtyChange(producto.id, item.cantidad - 1)}
              aria-label="Disminuir cantidad"
            >
              <span className="text-base leading-none">−</span>
            </Button>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={item.cantidad}
              onChange={(ev) =>
                onQtyChange(
                  producto.id,
                  Math.max(0, Number(ev.target.value) || 0),
                )
              }
              className="h-7 w-12 rounded-md border bg-background text-center text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={`Cantidad de ${producto.nombre}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onQtyChange(producto.id, item.cantidad + 1)}
              aria-label="Aumentar cantidad"
            >
              <span className="text-base leading-none">+</span>
            </Button>
          </div>

          {/* Fecha de entrega (obligatoria) */}
          <DatePicker
            id={`fecha-${producto.id}`}
            value={item.fechaEntrega}
            onChange={(iso) => onFechaChange(producto.id, iso)}
            invalid={fechaFaltante}
            compact
            placeholder="Fecha de entrega"
          />
        </div>

        {/* Bloque derecho: total + chevron, alineado al borde derecho */}
        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="text-sm font-bold tabular-nums text-brand">
              {formatCOP(total)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Contraer detalle' : 'Ver detalle'}
            className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ChevronDown
              className={cn('size-5 transition-transform', open && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Mensaje de validación de fecha */}
      {showErrors && fechaFaltante && (
        <p className="border-t border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
          Selecciona una fecha de entrega para este producto.
        </p>
      )}

      {/* Detalle expandido */}
      {open && (
        <div className="flex flex-col gap-4 border-t bg-muted/20 p-4">
          <div className="flex flex-col gap-2">
            <DetailRow label="Precio unitario" value={formatCOP(producto.precio)} />
            <DetailRow label="Cantidad" value={item.cantidad} />
            <DetailRow label="Subtotal neto" value={formatCOP(neto)} />
            <DetailRow label={`IVA (${formatPct(producto.iva)})`} value={formatCOP(iva)} />
            <Separator />
            <DetailRow label="Total línea" value={formatCOP(total)} emphasis />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onQtyChange(producto.id, 0)}
            className="self-start text-destructive hover:text-destructive"
          >
            <Trash2 data-icon="inline-start" />
            Quitar producto
          </Button>
        </div>
      )}
    </div>
  )
}
