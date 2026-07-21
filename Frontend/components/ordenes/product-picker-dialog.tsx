'use client'

import * as React from 'react'
import Image from 'next/image'
import { Layers, Minus, Paintbrush, Plus, Search, ShoppingCart } from 'lucide-react'
import type {
  CategoriaProducto,
  ItemPedido,
  Producto,
  TipoProducto,
} from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { nuevoItemId } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ProductPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoProducto: TipoProducto
  currentItems: ItemPedido[]
  onConfirm: (items: ItemPedido[]) => void
}

/**
 * Definición de secciones por categoría para productos en saco.
 * Para soportar nuevas categorías (ej. aditivos, herramientas) basta con
 * agregar una entrada aquí y asignar esa categoría a los productos.
 */
const SECCIONES_SACO: {
  categoria: CategoriaProducto
  titulo: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { categoria: 'cemento', titulo: 'Cemento', icon: Layers },
  { categoria: 'linea_acabados', titulo: 'Línea de acabados', icon: Paintbrush },
]

/** Etiqueta corta por categoría, usada en el modo "resultados de búsqueda". */
const CATEGORIA_LABEL: Record<CategoriaProducto, string> = {
  cemento: 'Cemento',
  linea_acabados: 'Acabados',
}

/** Altura fija del área de productos para que el modal no "salte" entre tabs. */
const SCROLL_AREA = 'h-[min(52vh,440px)] overflow-y-auto'

export function ProductPickerDialog({
  open,
  onOpenChange,
  tipoProducto,
  currentItems,
  onConfirm,
}: ProductPickerDialogProps) {
  const { productos } = usePortal()
  const [query, setQuery] = React.useState('')
  /**
   * Borrador como lista de LÍNEAS (no Record por producto): así se conservan
   * id y fecha de las líneas existentes y no se colapsan productos repetidos.
   */
  const [draft, setDraft] = React.useState<ItemPedido[]>([])
  const [activeTab, setActiveTab] = React.useState<string>(
    SECCIONES_SACO[0].categoria,
  )

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActiveTab(SECCIONES_SACO[0].categoria)
      setDraft(currentItems.map((i) => ({ ...i })))
    }
  }, [open, currentItems])

  const disponibles = React.useMemo(
    () => productos.filter((p) => p.tipo === tipoProducto),
    [productos, tipoProducto],
  )

  const searching = query.trim().length > 0

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return disponibles
    return disponibles.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q),
    )
  }, [disponibles, query])

  /** Productos por categoría (sin filtrar) para poblar pestañas y contadores. */
  const porCategoria = React.useMemo(() => {
    const map = new Map<CategoriaProducto, Producto[]>()
    for (const s of SECCIONES_SACO) {
      map.set(
        s.categoria,
        disponibles.filter((p) => p.categoria === s.categoria),
      )
    }
    return map
  }, [disponibles])

  /** Cantidad mostrada en la tarjeta: la de la primera línea del producto. */
  function qtyDe(productoId: string): number {
    return draft.find((i) => i.productoId === productoId)?.cantidad ?? 0
  }

  /**
   * El stepper opera sobre la primera línea del producto; las líneas
   * duplicadas adicionales (p. ej. creadas desde Servicio) se conservan.
   */
  function setQty(productoId: string, qty: number) {
    setDraft((prev) => {
      const idx = prev.findIndex((i) => i.productoId === productoId)
      if (idx === -1) {
        if (qty <= 0) return prev
        return [
          ...prev,
          { id: nuevoItemId(), productoId, cantidad: qty, fechaEntrega: null },
        ]
      }
      if (qty <= 0) return prev.filter((_, i) => i !== idx)
      return prev.map((it, i) => (i === idx ? { ...it, cantidad: qty } : it))
    })
  }

  const totalUnidades = draft.reduce((a, i) => a + i.cantidad, 0)
  const totalProductos = draft.length

  function handleConfirm() {
    onConfirm(draft)
    onOpenChange(false)
  }

  /** Solo las secciones con productos (para mostrar pestañas relevantes). */
  const seccionesConProductos = SECCIONES_SACO.filter(
    (s) => (porCategoria.get(s.categoria)?.length ?? 0) > 0,
  )
  const mostrarTabs =
    tipoProducto === 'saco' && !searching && seccionesConProductos.length > 1

  const emptyState = (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>Sin productos</EmptyTitle>
        <EmptyDescription>
          No hay productos que coincidan con tu búsqueda.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>
            Agregar productos · {tipoProducto === 'saco' ? 'Cemento en saco' : 'Cemento a granel'}
          </DialogTitle>
          <DialogDescription>
            Ajusta las cantidades de los productos que deseas incluir en el
            pedido.
          </DialogDescription>
          <InputGroup className="mt-2">
            <InputGroupInput
              placeholder="Buscar por nombre o marca..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </DialogHeader>

        {mostrarTabs ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="gap-0"
          >
            <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
              {seccionesConProductos.map((s) => {
                const Icon = s.icon
                const count = porCategoria.get(s.categoria)?.length ?? 0
                return (
                  <TabsTrigger
                    key={s.categoria}
                    value={s.categoria}
                    className={cn(
                      'flex-none gap-2 rounded-none border-0 px-4 py-2.5',
                      'after:hidden',
                      'text-foreground/60 hover:bg-muted/60',
                      'data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none',
                    )}
                  >
                    <Icon className="size-4" />
                    {s.titulo}
                    <Badge
                      variant="secondary"
                      className="ml-1 group-data-active/tabs:bg-primary-foreground/20"
                    >
                      {count}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {seccionesConProductos.map((s) => (
              <TabsContent key={s.categoria} value={s.categoria}>
                <div className={cn(SCROLL_AREA, 'p-4')}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(porCategoria.get(s.categoria) ?? []).map((producto) => (
                      <ProductoCard
                        key={producto.id}
                        producto={producto}
                        qty={qtyDe(producto.id)}
                        onSetQty={setQty}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className={cn(SCROLL_AREA, 'p-4')}>
            {filtrados.length === 0 ? (
              emptyState
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtrados.map((producto) => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    qty={qtyDe(producto.id)}
                    onSetQty={setQty}
                    categoriaLabel={
                      searching && tipoProducto === 'saco'
                        ? CATEGORIA_LABEL[producto.categoria]
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'} en total
            </span>
          </div>
          <Button onClick={handleConfirm} disabled={totalProductos === 0}>
            <ShoppingCart data-icon="inline-start" />
            Agregar al pedido ({totalProductos})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProductoCard({
  producto,
  qty,
  onSetQty,
  categoriaLabel,
}: {
  producto: Producto
  qty: number
  onSetQty: (id: string, qty: number) => void
  categoriaLabel?: string
}) {
  const added = qty > 0
  return (
    <div
      className={cn(
        'relative flex gap-3 rounded-lg border bg-card p-3 transition-colors',
        added ? 'border-primary ring-1 ring-primary/20' : 'border-border',
      )}
    >
      {categoriaLabel && (
        <Badge
          variant="outline"
          className="absolute -left-2 -top-2 bg-card text-brand"
        >
          {categoriaLabel}
        </Badge>
      )}
      {added && (
        <Badge className="absolute -right-2 -top-2 px-2">{qty}</Badge>
      )}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={producto.imagen || '/placeholder.svg'}
          alt={producto.nombre}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {producto.marca}
        </span>
        <span className="font-medium leading-tight text-pretty">
          {producto.nombre}
        </span>
        <span className="text-xs text-muted-foreground">
          {producto.presentacion}
        </span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-semibold">
            {formatCOP(producto.precio)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              disabled={qty <= 0}
              onClick={() => onSetQty(producto.id, qty - 1)}
              aria-label={`Quitar uno de ${producto.nombre}`}
            >
              <Minus />
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={qty}
              onChange={(e) =>
                onSetQty(producto.id, Math.max(0, Number(e.target.value) || 0))
              }
              className="h-7 w-12 rounded-md border bg-background text-center text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={`Cantidad de ${producto.nombre}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onSetQty(producto.id, qty + 1)}
              aria-label={`Agregar uno de ${producto.nombre}`}
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
