'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Lock,
  Mail,
  MapPin,
  PackagePlus,
  Printer,
  Save,
  Store,
  Trash2,
  Truck,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  ContactoEntrega,
  ContactoRetira,
  DatosDespacho,
  ItemPedido,
  MetodoDespacho,
  MotivoVenta,
  Pedido,
} from '@/lib/types'
import {
  BODEGA_DEFAULT,
  BODEGAS,
  MOTIVO_VENTA_DEFAULT,
  MOTIVO_VENTA_LABEL,
  PLAZOS,
} from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import {
  bloqueosAprobacion,
  calcularLinea,
  totalesPedido,
} from '@/lib/order-utils'
import { formatCOP, formatFecha, formatPct } from '@/lib/format'
import { EstadoBadge } from '@/components/pedidos/estado-badge'
import { DatePicker } from '@/components/ordenes/date-picker'
import { AgregarProductosDialog } from '@/components/servicio/agregar-productos-dialog'
import { BitacoraCard } from '@/components/servicio/bitacora-card'
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
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * SUPOSICIÓN A CONFIRMAR (default pragmático de Fase 2):
 * tras "Solicitado" son editables método de despacho, sede/punto de entrega,
 * orden de compra, estiba/descarga, los datos de contacto, las observaciones
 * y las líneas de producto (agregar, cantidad, fecha, eliminar); los precios
 * los define el catálogo. Una vez "Aprobado" se bloquea toda edición.
 *
 * El borrador mantiene AMBOS objetos (entrega y retira): cambiar el método de
 * despacho no pierde lo ya cargado del otro método.
 */
interface Borrador {
  metodoDespacho: MetodoDespacho | null
  /** Sede que factura: solo se asigna desde esta vista de Gestión/Servicio. */
  sedeFacturaId: string | null
  bodegaCodigo: string
  motivoVenta: MotivoVenta
  plazoCodigo: string
  despacho: DatosDespacho
  contactoEntrega: ContactoEntrega
  contactoRetira: ContactoRetira
  items: ItemPedido[]
}

function borradorDesde(pedido: Pedido): Borrador {
  return {
    metodoDespacho: pedido.metodoDespacho,
    sedeFacturaId: pedido.sedeFacturaId,
    // Nunca vacíos: un pedido sin valor cae al default en vez de placeholder.
    bodegaCodigo: pedido.bodegaCodigo || BODEGA_DEFAULT,
    motivoVenta: pedido.motivoVenta || MOTIVO_VENTA_DEFAULT,
    plazoCodigo: pedido.plazoCodigo || '30D',
    despacho: { ...pedido.despacho },
    contactoEntrega: { ...pedido.contactoEntrega },
    contactoRetira: { ...pedido.contactoRetira },
    items: pedido.items.map((i) => ({ ...i })),
  }
}

const METODO_ITEMS = [
  { value: 'entregar', label: 'Entregar' },
  { value: 'retira', label: 'Retira' },
]

const MOTIVO_ITEMS = (
  Object.entries(MOTIVO_VENTA_LABEL) as [MotivoVenta, string][]
).map(([value, label]) => ({ value, label }))

export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  const {
    getProducto,
    getPuntoEntrega,
    actualizarPedido,
    aprobarPedido,
    rechazarPedido,
    eliminarPedido,
    registrarMensajePedido,
    sedes,
    puntosEntrega,
  } = usePortal()
  const router = useRouter()
  const [borrador, setBorrador] = React.useState<Borrador>(() =>
    borradorDesde(pedido),
  )
  const [agregarOpen, setAgregarOpen] = React.useState(false)
  const [confirmarSalida, setConfirmarSalida] = React.useState(false)
  const [rechazarOpen, setRechazarOpen] = React.useState(false)
  const [motivoRechazo, setMotivoRechazo] = React.useState('')
  // Eliminar: confirmación fuerte por número (acción irreversible).
  const [eliminarOpen, setEliminarOpen] = React.useState(false)
  const [confirmNumero, setConfirmNumero] = React.useState('')
  // Enviar por correo (simulado en el prototipo).
  const [correoOpen, setCorreoOpen] = React.useState(false)
  const [correoDestinatario, setCorreoDestinatario] = React.useState('')
  const [correoAsunto, setCorreoAsunto] = React.useState('')
  const [correoMensaje, setCorreoMensaje] = React.useState('')

  // Aprobado o rechazado = resuelto: se bloquea la edición de campos.
  const editable = pedido.estado !== 'aprobado' && pedido.estado !== 'rechazado'
  /** Solo un pedido 'solicitado' admite decisión (aprobar/rechazar). */
  const accionable = pedido.estado === 'solicitado'
  // Eliminar aparece en todos los estados menos 'aprobado': un pedido aprobado
  // es un documento comprometido y no debe borrarse desde esta vista.
  const mostrarEliminar = pedido.estado !== 'aprobado'
  const entregar = borrador.metodoDespacho !== 'retira'
  const despachoB = borrador.despacho
  const punto = getPuntoEntrega(despachoB.puntoEntregaId)
  // Totales en vivo sobre el borrador: reflejan cantidades y líneas sin guardar.
  const totales = totalesPedido(
    { ...pedido, items: borrador.items },
    getProducto,
  )
  const hayCantidadInvalida = borrador.items.some((i) => i.cantidad < 1)
  const dirty =
    JSON.stringify(borrador) !== JSON.stringify(borradorDesde(pedido))
  // Bloqueos de aprobación sobre el BORRADOR: el botón reacciona en vivo
  // mientras el asesor completa campos, sin esperar a "Guardar cambios".
  const bloqueos = accionable
    ? bloqueosAprobacion({
        ...pedido,
        metodoDespacho: borrador.metodoDespacho,
        sedeFacturaId: borrador.sedeFacturaId,
        despacho: borrador.despacho,
        contactoEntrega: borrador.contactoEntrega,
        contactoRetira: borrador.contactoRetira,
        items: borrador.items,
      })
    : []
  const bloqueo = bloqueos[0]
  /** Líneas por producto, para el badge "Línea X de Y" en repetidos. */
  const lineasPorProducto = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const i of borrador.items) {
      map.set(i.productoId, (map.get(i.productoId) ?? 0) + 1)
    }
    return map
  }, [borrador.items])

  const setDespacho = (patch: Partial<DatosDespacho>) =>
    setBorrador((b) => ({ ...b, despacho: { ...b.despacho, ...patch } }))
  const setContactoEntrega = (patch: Partial<ContactoEntrega>) =>
    setBorrador((b) => ({
      ...b,
      contactoEntrega: { ...b.contactoEntrega, ...patch },
    }))
  const setContactoRetira = (patch: Partial<ContactoRetira>) =>
    setBorrador((b) => ({
      ...b,
      contactoRetira: { ...b.contactoRetira, ...patch },
    }))
  const setFechaItem = (itemId: string, fechaEntrega: string) =>
    setBorrador((b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId ? { ...i, fechaEntrega } : i)),
    }))
  const setCantidadItem = (itemId: string, cantidad: number) =>
    setBorrador((b) => ({
      ...b,
      items: b.items.map((i) => (i.id === itemId ? { ...i, cantidad } : i)),
    }))
  const eliminarItem = (itemId: string) =>
    setBorrador((b) => ({
      ...b,
      items: b.items.filter((i) => i.id !== itemId),
    }))
  const agregarItems = (items: ItemPedido[]) =>
    setBorrador((b) => ({ ...b, items: [...b.items, ...items] }))

  // Cascada (igual que en "Crear orden"): cambiar de sede invalida el punto.
  const cambiarSede = (sedeId: string) => {
    if (sedeId === despachoB.sedeId) return
    setDespacho({ sedeId, puntoEntregaId: '' })
  }

  const sedeItems = React.useMemo(
    () =>
      sedes
        .filter((s) => s.activa)
        .map((s) => ({ value: s.id, label: s.nombre })),
    [sedes],
  )
  const puntosDisponibles = React.useMemo(
    () => puntosEntrega.filter((p) => p.sedeDespachoId === despachoB.sedeId),
    [puntosEntrega, despachoB.sedeId],
  )
  const puntoItems = React.useMemo(
    () =>
      puntosDisponibles.map((p) => ({
        value: p.id,
        label: `${p.nombre} · ${p.ciudad}`,
      })),
    [puntosDisponibles],
  )
  const sedeFacturaItems = React.useMemo(
    () =>
      sedes
        .filter((s) => s.activa)
        .map((s) => ({ value: s.id, label: `${s.nombre} · ${s.ciudad}` })),
    [sedes],
  )

  const guardar = () => {
    actualizarPedido(pedido.id, borrador)
    toast.success('Cambios guardados')
  }

  const aprobar = () => {
    aprobarPedido(pedido.id)
    toast.success(`Pedido ${pedido.numero} aprobado`)
  }

  const rechazar = () => {
    rechazarPedido(pedido.id, motivoRechazo.trim())
    toast.success(`Pedido ${pedido.numero} rechazado`)
    router.push('/servicio/pedidos')
  }

  const eliminar = () => {
    eliminarPedido(pedido.id)
    toast.success(`Pedido ${pedido.numero} eliminado`)
    router.push('/servicio/pedidos')
  }

  const imprimir = () => window.print()

  // Abre el diálogo de correo con valores por defecto (destinatario = contacto
  // de entrega si existe; asunto con el número de pedido).
  const abrirCorreo = () => {
    setCorreoDestinatario(pedido.contactoEntrega.correo || '')
    setCorreoAsunto(`Pedido ${pedido.numero} - Cementos San Marcos`)
    setCorreoMensaje('')
    setCorreoOpen(true)
  }

  const enviarCorreo = () => {
    const destinatario = correoDestinatario.trim()
    registrarMensajePedido(
      pedido.id,
      `CORREO ENVIADO a ${destinatario} — Asunto: ${correoAsunto.trim()}`,
    )
    setCorreoOpen(false)
    toast.success(`Correo enviado a ${destinatario}`)
  }

  const botonAprobar = (
    // El botón Aprobar y su subtexto de bloqueo comparten contenedor: el
    // motivo queda anclado inmediatamente debajo del botón que bloquea, con
    // el borde derecho alineado (items-end + text-right).
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={aprobar}
        disabled={!!bloqueo}
        className="gap-2 px-2 sm:px-3"
      >
        <CheckCircle2 className="size-4" />
        Aprobar pedido
      </Button>
      {bloqueo &&
        (bloqueos.length > 1 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center gap-1 text-right text-xs text-amber-600 dark:text-amber-500" />
              }
            >
              <AlertTriangle className="size-3 shrink-0" aria-hidden />
              {bloqueo.mensaje} (+{bloqueos.length - 1} pendientes)
            </TooltipTrigger>
            <TooltipContent>
              <ul className="list-disc pl-4">
                {bloqueos.map((b) => (
                  <li key={b.campo}>{b.mensaje}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-flex items-center gap-1 text-right text-xs text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            {bloqueo.mensaje}
          </span>
        ))}
    </div>
  )

  return (
    <div className="flex flex-col">
      {/* El pb reserva el alto de la barra sticky (que ahora siempre se
          renderiza) para que la Bitácora nunca quede oculta. En 'solicitado'
          el bloque de decisión + subtexto la hace más alta; en el resto basta
          menos espacio. */}
      <div className={cn('flex flex-col gap-4', accionable ? 'pb-24' : 'pb-20')}>
        {/* Retorno al listado; con cambios sin guardar pide confirmación. */}
        <Link
          href="/servicio/pedidos"
          onClick={(e) => {
            if (dirty) {
              e.preventDefault()
              setConfirmarSalida(true)
            }
          }}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
        >
          <ArrowLeft className="size-4" />
          Volver a Pedidos de ventas
        </Link>

        {/* Encabezado */}
        <Card className="gap-3 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-lg font-bold text-[#00359a]">
              {pedido.numero}
            </h2>
            <EstadoBadge estado={pedido.estado} />
            {borrador.metodoDespacho && (
              <Badge
                variant={entregar ? 'default' : 'secondary'}
                className="gap-1"
              >
                {entregar ? (
                  <Truck className="size-3" />
                ) : (
                  <Store className="size-3" />
                )}
                {entregar ? 'Entregar' : 'Retira'}
              </Badge>
            )}
            {!editable && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                {pedido.estado === 'rechazado'
                  ? 'Rechazado: edición bloqueada'
                  : 'Aprobado: edición bloqueada'}
              </span>
            )}
          </div>
          {/* Fila 1: Cliente · Fecha — Fila 2: Sede · Punto · Sede factura */}
          <div className="grid items-start gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Cliente" value={pedido.clienteNombre} />
            <InfoItem
              label="Fecha de creación"
              value={formatFecha(pedido.fechaCreacion.slice(0, 10))}
            />
            {/* col-start fuerza el salto: la 3.ª columna de la fila 1 queda vacía. */}
            <Campo label="Sede" className="lg:col-start-1">
              <Select
                items={sedeItems}
                value={despachoB.sedeId || null}
                onValueChange={(v) => cambiarSede((v as string) ?? '')}
                disabled={!editable}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona la sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sedeItems.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Campo>
            <Campo label={entregar ? 'Punto de entrega' : 'Punto de retiro'}>
              <Select
                items={puntoItems}
                value={despachoB.puntoEntregaId || null}
                onValueChange={(v) =>
                  setDespacho({ puntoEntregaId: (v as string) ?? '' })
                }
                disabled={!editable || !despachoB.sedeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      despachoB.sedeId
                        ? 'Selecciona el punto'
                        : 'Primero selecciona una sede'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {puntoItems.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* Dirección resuelta del punto seleccionado. */}
              {punto && (
                <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#00359a]" />
                  <span className="text-pretty">
                    {[punto.direccion, punto.ciudad].filter(Boolean).join(', ')}
                  </span>
                </span>
              )}
            </Campo>
            <Campo label="Sede factura">
              <Select
                items={sedeFacturaItems}
                value={borrador.sedeFacturaId}
                onValueChange={(v) =>
                  setBorrador((b) => ({
                    ...b,
                    sedeFacturaId: (v as string) ?? null,
                  }))
                }
                disabled={!editable}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      <span className="flex items-center gap-1 text-xs text-[#ff6600]">
                        <AlertCircle
                          className="size-3.5 shrink-0"
                          aria-hidden
                        />
                        Sin asignar
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sedeFacturaItems.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Campo>
          </div>
        </Card>

        {/* Datos de despacho */}
        <Card className="gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-brand">
              Datos de despacho
            </h3>
            <p className="text-xs text-muted-foreground">
              Contacto y observaciones editables mientras el pedido no esté
              aprobado.
            </p>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            {/* Celda izquierda apilada: equilibra la altura del sub-bloque vecino. */}
            <div className="flex flex-col gap-4">
              <Campo label="Orden de compra">
                <Input
                  value={despachoB.ordenCompra}
                  onChange={(e) => setDespacho({ ordenCompra: e.target.value })}
                  disabled={!editable}
                />
              </Campo>
              <Campo label="Método de despacho">
                <Select
                  items={METODO_ITEMS}
                  value={borrador.metodoDespacho}
                  onValueChange={(v) => {
                    const metodo = v as MetodoDespacho
                    setBorrador((b) => ({
                      ...b,
                      metodoDespacho: metodo,
                      // La descarga solo aplica a 'entregar': en Retira va off.
                      despacho:
                        metodo === 'retira'
                          ? { ...b.despacho, necesitaDescarga: false }
                          : b.despacho,
                    }))
                  }}
                  disabled={!editable}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {METODO_ITEMS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Campo>
            </div>
            {/* Sub-bloque con altura propia: la nota no empuja las celdas vecinas. */}
            <fieldset className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Servicios adicionales
              </Label>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <CampoSiNo
                  id="estiba"
                  label="¿Requiere estiba?"
                  value={despachoB.necesitaEstiba}
                  onChange={(v) => setDespacho({ necesitaEstiba: v })}
                  disabled={!editable}
                />
                {/* En "Retira" solo aplica estiba: no hay descarga en planta. */}
                {entregar && (
                  <CampoSiNo
                    id="descarga"
                    label="¿Requiere descarga?"
                    value={despachoB.necesitaDescarga}
                    onChange={(v) => setDespacho({ necesitaDescarga: v })}
                    disabled={!editable}
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
            {/* Bloque de contacto: lo único que se intercambia con el método. */}
            {entregar ? (
              <>
                <Campo label="Recibe">
                  <Input
                    value={borrador.contactoEntrega.nombreRecibe}
                    onChange={(e) =>
                      setContactoEntrega({ nombreRecibe: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
                <Campo label="Celular">
                  <Input
                    value={borrador.contactoEntrega.celular}
                    onChange={(e) =>
                      setContactoEntrega({ celular: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
                <Campo label="Correo">
                  <Input
                    type="email"
                    value={borrador.contactoEntrega.correo}
                    onChange={(e) =>
                      setContactoEntrega({ correo: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
              </>
            ) : (
              <>
                <Campo label="Conductor">
                  <Input
                    value={borrador.contactoRetira.nombreConductor}
                    onChange={(e) =>
                      setContactoRetira({ nombreConductor: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
                <Campo label="Cédula">
                  <Input
                    value={borrador.contactoRetira.cedula}
                    onChange={(e) =>
                      setContactoRetira({ cedula: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
                <Campo label="Placa">
                  <Input
                    value={borrador.contactoRetira.placa}
                    onChange={(e) =>
                      setContactoRetira({ placa: e.target.value.toUpperCase() })
                    }
                    disabled={!editable}
                  />
                </Campo>
                <Campo label="Celular">
                  <Input
                    value={borrador.contactoRetira.celular}
                    onChange={(e) =>
                      setContactoRetira({ celular: e.target.value })
                    }
                    disabled={!editable}
                  />
                </Campo>
              </>
            )}
            {/* Observaciones es común: no se reinicia al alternar el método. */}
            <Campo label="Observaciones" className="sm:col-span-2">
              <Textarea
                value={despachoB.observaciones}
                onChange={(e) => setDespacho({ observaciones: e.target.value })}
                disabled={!editable}
                rows={2}
              />
            </Campo>
          </div>
        </Card>

        {/* Productos */}
        <Card className="gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-brand">Productos</h3>
            <p className="text-xs text-muted-foreground">
              Puedes agregar productos y ajustar cantidades y fechas. Los
              precios los define el catálogo y no son editables.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">P. unit.</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  {editable && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrador.items.map((item, index) => {
                  const prod = getProducto(item.productoId)
                  if (!prod) return null
                  const linea = calcularLinea(prod, item.cantidad)
                  const cantidadInvalida = item.cantidad < 1
                  const totalLineas =
                    lineasPorProducto.get(item.productoId) ?? 1
                  const ordinal = borrador.items
                    .slice(0, index + 1)
                    .filter((i) => i.productoId === item.productoId).length
                  const esUltima = borrador.items.length === 1
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                            <Image
                              src={prod.imagen || '/placeholder.svg'}
                              alt={prod.nombre}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {prod.nombre}
                              </span>
                              {/* Repetición intencional: mismo producto, despachos distintos. */}
                              {totalLineas > 1 && (
                                <Badge variant="secondary" className="shrink-0">
                                  Línea {ordinal} de {totalLineas}
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {prod.codigo} · {prod.unidad}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {editable ? (
                          <DatePicker
                            value={item.fechaEntrega}
                            onChange={(iso) => setFechaItem(item.id, iso)}
                            invalid={!item.fechaEntrega}
                            compact
                            placeholder="Sin fecha"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {item.fechaEntrega
                              ? formatFecha(item.fechaEntrega)
                              : '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCOP(prod.precio)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={item.cantidad === 0 ? '' : item.cantidad}
                            onChange={(e) => {
                              // Sin decimales; vacío/0/negativo queda en 0 (inválido).
                              const n = Math.floor(Number(e.target.value))
                              setCantidadItem(
                                item.id,
                                Number.isFinite(n) && n > 0 ? n : 0,
                              )
                            }}
                            aria-invalid={cantidadInvalida}
                            aria-label={`Cantidad de ${prod.nombre}`}
                            className="ml-auto h-8 w-20 text-right tabular-nums"
                          />
                        ) : (
                          <span className="tabular-nums">{item.cantidad}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCOP(linea.neto)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCOP(linea.iva)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCOP(linea.total)}
                      </TableCell>
                      {editable && (
                        <TableCell className="text-right">
                          {esUltima ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={<span className="inline-flex" />}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled
                                  aria-label={`Eliminar línea de ${prod.nombre}`}
                                >
                                  <Trash2 className="text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                El pedido debe tener al menos un producto.
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarItem(item.id)}
                              aria-label={`Eliminar línea de ${prod.nombre}`}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {borrador.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={editable ? 8 : 7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Este pedido aún no tiene productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {editable && (
            <div className="flex flex-col gap-2">
              {hayCantidadInvalida && (
                <p className="text-sm font-medium text-destructive">
                  La cantidad debe ser mayor que 0.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setAgregarOpen(true)}
                disabled={pedido.tipoProducto === null}
                className="gap-2 self-start"
              >
                <PackagePlus className="size-4" />
                Agregar producto
              </Button>
            </div>
          )}

          <div className="flex flex-col items-end gap-1 text-sm">
            <TotalRow label="Neto" value={totales.neto} />
            <TotalRow label={`IVA (${formatPct(0.19)})`} value={totales.iva} />
            <Separator className="my-1 w-48" />
            <div className="flex w-48 items-center justify-between">
              <span className="font-semibold">Total pedido</span>
              <span className="font-bold tabular-nums text-primary">
                {formatCOP(totales.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Condiciones comerciales */}
        <Card className="gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-brand">
              Condiciones comerciales
            </h3>
            <p className="text-xs text-muted-foreground">
              Bodega de despacho, motivo de venta y condiciones de pago del
              pedido.
            </p>
          </div>
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo label="Bodega">
              <BodegaCombobox
                value={borrador.bodegaCodigo}
                onChange={(codigo) =>
                  setBorrador((b) => ({ ...b, bodegaCodigo: codigo }))
                }
                disabled={!editable}
              />
              <span className="text-xs text-muted-foreground">
                Bodega desde la que sale el producto.
              </span>
            </Campo>
            <Campo label="Motivo de venta">
              <Select
                items={MOTIVO_ITEMS}
                value={borrador.motivoVenta}
                onValueChange={(v) =>
                  setBorrador((b) => ({
                    ...b,
                    motivoVenta: (v as MotivoVenta) ?? MOTIVO_VENTA_DEFAULT,
                  }))
                }
                disabled={!editable}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {MOTIVO_ITEMS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Campo>
            {/* Solo lectura: viene del maestro del cliente, no es un input. */}
            <div className="flex flex-col gap-1.5">
              <InfoItem label="Forma de pago" value={pedido.formaPago} />
              <span className="text-xs text-muted-foreground">
                Definida en el maestro del cliente.
              </span>
            </div>
            <Campo label="Plazo">
              <PlazoCombobox
                value={borrador.plazoCodigo}
                onChange={(codigo) =>
                  setBorrador((b) => ({ ...b, plazoCodigo: codigo }))
                }
                disabled={!editable}
              />
            </Campo>
          </div>
        </Card>

        {/* Bitácora: historial de solo lectura, visible también en aprobados. */}
        <BitacoraCard eventos={pedido.bitacora} />
      </div>

      {/* Barra sticky de acciones: siempre visible para Gestión/Servicio; su
          contenido cambia según el estado. Cluster izquierdo (Eliminar, lejos
          de Aprobar para evitar clics accidentales) y cluster derecho (apoyo +
          Guardar + decisión). Los márgenes negativos la extienden al ancho de
          la columna de contenido. `print:hidden` la excluye al imprimir. */}
      <div className="sticky bottom-0 z-30 -mx-4 flex items-start gap-3 border-t bg-background/95 px-4 py-3 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.15)] backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden md:-mx-6 md:px-6">
        {/* IZQUIERDA: Eliminar, acción destructiva de alto riesgo, aislada al
            borde izquierdo. En móvil colapsa a solo icono (el borde rojo + el
            AlertDialog de confirmación mantienen la protección). */}
        {mostrarEliminar && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={() => setEliminarOpen(true)}
                  aria-label="Eliminar pedido"
                  className="gap-2 border-destructive/40 px-2 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive sm:px-3"
                />
              }
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </TooltipTrigger>
            <TooltipContent>Eliminar pedido</TooltipContent>
          </Tooltip>
        )}

        {/* DERECHA: apoyo · Guardar · decisión. */}
        <div className="ml-auto flex items-start gap-3">
          {/* Acciones de apoyo: iconos ghost sin texto, agrupadas juntas. */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={imprimir}
                    aria-label="Imprimir"
                  />
                }
              >
                <Printer className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Imprimir</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={abrirCorreo}
                    aria-label="Enviar por correo"
                  />
                }
              >
                <Mail className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Enviar por correo</TooltipContent>
            </Tooltip>
          </div>

          {/* Divisor: separa el apoyo de Guardar/decisión (solo si hay algo
              editable/accionable a la derecha). */}
          {editable && (
            <div aria-hidden className="h-9 w-px self-center bg-border" />
          )}

          {/* Guardar cambios: solo en estados editables. */}
          {editable && (
            <Button
              variant="outline"
              onClick={guardar}
              disabled={!dirty || hayCantidadInvalida}
              className="gap-2 px-2 sm:px-3"
            >
              <Save className="size-4" />
              Guardar cambios
            </Button>
          )}

          {/* Bloque de decisión: solo en 'solicitado'. */}
          {accionable && (
            <>
              {/* Divisor + espacio: aparta Guardar del par de decisión. */}
              <div
                aria-hidden
                className="mx-2 h-9 w-px self-center bg-border"
              />
              <Button
                variant="outline"
                onClick={() => setRechazarOpen(true)}
                className="gap-2 border-destructive/40 px-2 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive sm:px-3"
              >
                <XCircle className="size-4" />
                Rechazar pedido
              </Button>
              {/* Divisor interno: separación anti-doble-click Rechazar / Aprobar. */}
              <div aria-hidden className="h-9 w-px self-center bg-border" />
              {botonAprobar}
            </>
          )}
        </div>
      </div>

      {pedido.tipoProducto !== null && (
        <AgregarProductosDialog
          open={agregarOpen}
          onOpenChange={setAgregarOpen}
          tipoProducto={pedido.tipoProducto}
          itemsActuales={borrador.items}
          onConfirm={agregarItems}
        />
      )}

      {/* Confirmación al salir con cambios sin guardar */}
      <AlertDialog open={confirmarSalida} onOpenChange={setConfirmarSalida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tienes cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora se perderán los cambios de este pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              onClick={() => router.push('/servicio/pedidos')}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rechazo con motivo obligatorio: queda como evento en la bitácora. */}
      <AlertDialog
        open={rechazarOpen}
        onOpenChange={(open) => {
          setRechazarOpen(open)
          if (!open) setMotivoRechazo('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar pedido {pedido.numero}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marca el pedido como rechazado. Indica el motivo para
              dejar constancia en la bitácora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Campo label="Motivo del rechazo">
            <Textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
              placeholder="Escribe el motivo (mínimo 10 caracteres)"
              autoFocus
            />
          </Campo>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              disabled={motivoRechazo.trim().length < 10}
              onClick={rechazar}
            >
              Rechazar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar: acción irreversible. Confirmación fuerte escribiendo el
          número del pedido, para evitar borrados accidentales. */}
      <AlertDialog
        open={eliminarOpen}
        onOpenChange={(open) => {
          setEliminarOpen(open)
          if (!open) setConfirmNumero('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pedido {pedido.numero}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido y su bitácora se
              eliminarán de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Campo label={`Escribe el número del pedido para confirmar`}>
            <Input
              value={confirmNumero}
              onChange={(e) => setConfirmNumero(e.target.value)}
              placeholder={pedido.numero}
              autoFocus
            />
          </Campo>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              disabled={confirmNumero.trim() !== pedido.numero}
              onClick={eliminar}
            >
              Eliminar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enviar por correo: comportamiento simulado en el prototipo (no hay
          envío real). Registra el evento en la bitácora al enviar. */}
      <Dialog open={correoOpen} onOpenChange={setCorreoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar pedido por correo</DialogTitle>
            <DialogDescription>
              Envía el detalle del pedido {pedido.numero} al destinatario
              indicado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Campo label="Destinatario">
              <Input
                type="email"
                value={correoDestinatario}
                onChange={(e) => setCorreoDestinatario(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </Campo>
            <Campo label="Asunto">
              <Input
                value={correoAsunto}
                onChange={(e) => setCorreoAsunto(e.target.value)}
              />
            </Campo>
            <Campo label="Mensaje">
              <Textarea
                value={correoMensaje}
                onChange={(e) => setCorreoMensaje(e.target.value)}
                rows={4}
                placeholder="Escribe un mensaje (opcional)"
              />
            </Campo>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorreoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={enviarCorreo}
              disabled={!correoDestinatario.trim()}
              className="gap-2"
            >
              <Mail className="size-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Combobox de Bodegas (catálogo BODEGAS, mismo patrón que SedeCombobox).
 * La lista es larga y crecerá: búsqueda por nombre/código y popover con scroll.
 * Muestra "NOMBRE (CODIGO)" igual que el sistema actual.
 */
function BodegaCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (codigo: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selected = BODEGAS.find((b) => b.codigo === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <Warehouse className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected.nombre} ({selected.codigo})
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Selecciona una bodega</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar bodega..." />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>
              <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                <Warehouse className="size-4" />
                No se encontraron bodegas con ese nombre.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {BODEGAS.map((bodega) => (
                <CommandItem
                  key={bodega.codigo}
                  value={`${bodega.nombre} ${bodega.codigo}`}
                  onSelect={() => {
                    onChange(bodega.codigo)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <Warehouse className="size-4 text-muted-foreground" />
                  <span className="truncate">
                    {bodega.nombre} ({bodega.codigo})
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === bodega.codigo ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Combobox de Plazos de pago (catálogo PLAZOS). Muestra "CODIGO : NOMBRE"
 * igual que el sistema actual y respeta el orden del catálogo (no alfabético).
 */
function PlazoCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (codigo: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selected = PLAZOS.find((p) => p.codigo === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span className="truncate">
            {selected.codigo} : {selected.nombre}
          </span>
        ) : (
          <span className="truncate">{value}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar plazo..." />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>
              <span className="flex flex-col items-center gap-1 py-2 text-sm text-muted-foreground">
                No se encontraron plazos con ese nombre.
              </span>
            </CommandEmpty>
            <CommandGroup>
              {PLAZOS.map((plazo) => (
                <CommandItem
                  key={plazo.codigo}
                  value={`${plazo.codigo} ${plazo.nombre}`}
                  onSelect={() => {
                    onChange(plazo.codigo)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <span className="truncate">
                    {plazo.codigo} : {plazo.nombre}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === plazo.codigo ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1 font-medium text-pretty">
        {icon}
        {value || '—'}
      </span>
    </div>
  )
}

function Campo({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function CampoSiNo({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <RadioGroup
        value={value ? 'si' : 'no'}
        onValueChange={(v) => onChange(v === 'si')}
        disabled={disabled}
        className="flex h-8 items-center gap-4"
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

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex w-48 items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatCOP(value)}</span>
    </div>
  )
}
