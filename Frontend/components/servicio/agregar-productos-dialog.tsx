'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Layers,
  Minus,
  Paintbrush,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  CategoriaProducto,
  ItemPedido,
  Producto,
  TipoProducto,
} from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { nuevoItemId } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

interface AgregarProductosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoProducto: TipoProducto
  /** Líneas actuales del borrador: solo para el badge "Ya en el pedido". */
  itemsActuales: ItemPedido[]
  /** Hace append de TODAS las líneas preparadas al borrador (nunca merge). */
  onConfirm: (items: ItemPedido[]) => void
}

/** Secciones por categoría para saco (mismo criterio que ProductPickerDialog). */
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

/**
 * Diálogo de Servicio para AGREGAR líneas al pedido. Replica el patrón del
 * ProductPickerDialog del cliente, con una diferencia clave: abre siempre con
 * los steppers en 0 (no precarga el pedido) y al confirmar cada cantidad > 0
 * entra como línea NUEVA con id propio — nunca se suma a una línea existente.
 * La fecha de entrega se asigna después, por línea, en la tabla del detalle.
 */
export function AgregarProductosDialog({
  open,
  onOpenChange,
  tipoProducto,
  itemsActuales,
  onConfirm,
}: AgregarProductosDialogProps) {
  const { productos } = usePortal()
  const [query, setQuery] = React.useState('')
  /**
   * Lista de LÍNEAS (no Record por producto): la misma referencia de producto
   * puede aparecer varias veces, una por línea "+ Otra línea".
   */
  const [pendientes, setPendientes] = React.useState<ItemPedido[]>([])
  const [confirmarDescarte, setConfirmarDescarte] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>(
    SECCIONES_SACO[0].categoria,
  )

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActiveTab(SECCIONES_SACO[0].categoria)
      // Siempre abre vacío: aquí solo se agregan líneas nuevas; las
      // existentes se editan desde la tabla del detalle.
      setPendientes([])
      setConfirmarDescarte(false)
    }
  }, [open])

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

  const lineasDe = (productoId: string) =>
    pendientes.filter((i) => i.productoId === productoId)

  function nuevaLinea(productoId: string, cantidad = 1) {
    setPendientes((prev) => [
      ...prev,
      { id: nuevoItemId(), productoId, cantidad, fechaEntrega: null },
    ])
  }

  /** Bajar un stepper a 0 elimina esa línea de la preparación. */
  function setCantidadLinea(itemId: string, cantidad: number) {
    setPendientes((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.id !== itemId)
        : prev.map((i) => (i.id === itemId ? { ...i, cantidad } : i)),
    )
  }

  function quitarLinea(itemId: string) {
    setPendientes((prev) => prev.filter((i) => i.id !== itemId))
  }

  const n = pendientes.length
  const totalUnidades = pendientes.reduce((a, i) => a + i.cantidad, 0)
  const totalProductos = new Set(pendientes.map((i) => i.productoId)).size

  /** Cerrar (Escape/X/Cancelar) con líneas pendientes pide confirmación. */
  function handleOpenChange(next: boolean) {
    if (!next && n > 0) {
      setConfirmarDescarte(true)
      return
    }
    onOpenChange(next)
  }

  function handleConfirm() {
    if (n === 0) return
    onConfirm(pendientes)
    toast.success(
      n === 1
        ? '1 producto agregado al pedido'
        : `${n} productos agregados al pedido`,
    )
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

  const cardDe = (producto: Producto, categoriaLabel?: string) => (
    <ProductoCard
      key={producto.id}
      producto={producto}
      lineas={lineasDe(producto.id)}
      enPedido={
        itemsActuales.filter((i) => i.productoId === producto.id).length
      }
      onNuevaLinea={nuevaLinea}
      onSetCantidad={setCantidadLinea}
      onQuitarLinea={quitarLinea}
      categoriaLabel={categoriaLabel}
    />
  )

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle>
              Agregar productos · {tipoProducto === 'saco' ? 'Cemento en saco' : 'Cemento a granel'}
            </DialogTitle>
            <DialogDescription>
              Cada cantidad se agrega como una línea nueva del pedido; las
              líneas existentes se editan desde la tabla.
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
                      {(porCategoria.get(s.categoria) ?? []).map((producto) =>
                        cardDe(producto),
                      )}
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
                  {filtrados.map((producto) =>
                    cardDe(
                      producto,
                      searching && tipoProducto === 'saco'
                        ? CATEGORIA_LABEL[producto.categoria]
                        : undefined,
                    ),
                  )}
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
            <Button onClick={handleConfirm} disabled={n === 0}>
              <ShoppingCart data-icon="inline-start" />
              Agregar al pedido · {n} {n === 1 ? 'línea' : 'líneas'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación al cerrar con líneas en preparación */}
      <AlertDialog open={confirmarDescarte} onOpenChange={setConfirmarDescarte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar líneas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes {n} {n === 1 ? 'línea' : 'líneas'} sin agregar.
              ¿Descartarlas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmarDescarte(false)
                onOpenChange(false)
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ProductoCard({
  producto,
  lineas,
  enPedido,
  onNuevaLinea,
  onSetCantidad,
  onQuitarLinea,
  categoriaLabel,
}: {
  producto: Producto
  /** Líneas en preparación de ESTE producto (puede haber varias). */
  lineas: ItemPedido[]
  /** Cuántas líneas de este producto ya tiene el pedido (informativo). */
  enPedido: number
  onNuevaLinea: (productoId: string, cantidad?: number) => void
  onSetCantidad: (itemId: string, cantidad: number) => void
  onQuitarLinea: (itemId: string) => void
  categoriaLabel?: string
}) {
  const added = lineas.length > 0
  const totalQty = lineas.reduce((a, i) => a + i.cantidad, 0)
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
        <Badge className="absolute -right-2 -top-2 px-2">{totalQty}</Badge>
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
        <span className="font-medium leading-tight text-pretty">
          {producto.nombre}
        </span>
        <span className="text-xs text-muted-foreground">
          {producto.codigo} · {producto.presentacion}
        </span>
        {/* Informativo: repetir el producto es válido, no bloquea nada. */}
        {enPedido > 0 && (
          <Badge variant="secondary" className="mt-1 self-start">
            Ya en el pedido · {enPedido} {enPedido === 1 ? 'línea' : 'líneas'}
          </Badge>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-sm font-semibold">
            {formatCOP(producto.precio)}
          </span>
          <div className="flex flex-col items-end gap-1">
            {lineas.length === 0 ? (
              /* Stepper "fantasma" en 0: subirlo crea la primera línea. */
              <Stepper
                cantidad={0}
                nombre={producto.nombre}
                onCambio={(qty) => {
                  if (qty > 0) onNuevaLinea(producto.id, qty)
                }}
              />
            ) : (
              lineas.map((linea, idx) => (
                <div key={linea.id} className="flex items-center gap-1">
                  {lineas.length > 1 && (
                    <span className="text-[11px] text-muted-foreground">
                      Línea {idx + 1}
                    </span>
                  )}
                  <Stepper
                    cantidad={linea.cantidad}
                    nombre={producto.nombre}
                    onCambio={(qty) => onSetCantidad(linea.id, qty)}
                  />
                  {idx >= 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onQuitarLinea(linea.id)}
                      aria-label={`Descartar línea ${idx + 1} de ${producto.nombre}`}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            )}
            {added && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onNuevaLinea(producto.id)}
                className="h-6 px-1 text-xs text-muted-foreground"
              >
                + Otra línea
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Stepper Minus · valor · Plus, idéntico al del picker del cliente. */
function Stepper({
  cantidad,
  nombre,
  onCambio,
}: {
  cantidad: number
  nombre: string
  onCambio: (cantidad: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={cantidad <= 0}
        onClick={() => onCambio(cantidad - 1)}
        aria-label={`Quitar uno de ${nombre}`}
      >
        <Minus />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={cantidad}
        onChange={(e) => onCambio(Math.max(0, Number(e.target.value) || 0))}
        className="h-7 w-12 rounded-md border bg-background text-center text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label={`Cantidad de ${nombre}`}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        onClick={() => onCambio(cantidad + 1)}
        aria-label={`Agregar uno de ${nombre}`}
      >
        <Plus />
      </Button>
    </div>
  )
}
