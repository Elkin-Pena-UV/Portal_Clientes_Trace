'use client'

import * as React from 'react'
import Link from 'next/link'
import { Columns3, Eye, Pencil, Search } from 'lucide-react'
import type { EstadoPedido, Pedido, PuntoEntrega } from '@/lib/types'
import { ESTADO_LABEL, PLAZOS } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { plazoLabel, totalUnidades, totalesPedido } from '@/lib/order-utils'
import { formatCOP, formatFecha } from '@/lib/format'
import { EstadoBadge } from '@/components/pedidos/estado-badge'
import { EstadoCreditoBadge } from '@/components/pedidos/estado-credito-badge'
import { ClienteCombobox } from '@/components/ordenes/cliente-combobox'
import { DatePicker } from '@/components/ordenes/date-picker'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ESTADOS = Object.keys(ESTADO_LABEL) as EstadoPedido[]

type FiltroEstado = EstadoPedido | 'todos'

interface ListadoPedidosProps {
  /** gestion = Servicio al Cliente, supervision = Admin (solo lectura). */
  modo: 'gestion' | 'supervision'
  /** El link de detalle de cada pedido es `${basePath}/${id}`. */
  basePath: string
  /** Filtro de estado con el que arranca el listado. */
  estadoInicial?: EstadoPedido
}

/** Punto de entrega del pedido (bloque común: no depende del método). */
function puntoDePedido(
  pedido: Pedido,
  getPuntoEntrega: (id: string) => PuntoEntrega | undefined,
): PuntoEntrega | undefined {
  const puntoId = pedido.despacho.puntoEntregaId
  return puntoId ? getPuntoEntrega(puntoId) : undefined
}

// ---------------------------------------------------------------------------
// Definición única de columnas: de aquí derivan el encabezado, las celdas y
// el selector de columnas visibles. No duplicar esta lista en otro sitio.
// ---------------------------------------------------------------------------

type ColumnaKey =
  | 'numero'
  | 'pvc'
  | 'estadoCredito'
  | 'formaPago'
  | 'plazoCodigo'
  | 'estado'
  | 'fechaSolicitud'
  | 'clienteNombre'
  | 'clienteId'
  | 'puntoEntrega'
  | 'creadorEmail'
  | 'solicitados'
  | 'total'
  | 'moneda'
  | 'accion'

type VisibilidadColumnas = Record<ColumnaKey, boolean>

/** Contexto de una fila, ya resuelto (punto de entrega, totales) para las celdas. */
interface CeldaCtx {
  pedido: Pedido
  sede: PuntoEntrega | undefined
  total: number
  basePath: string
}

interface ColumnaDef {
  key: ColumnaKey
  label: string
  /** Cod y Acción no son ocultables: sin identificador ni acción la fila es inútil. */
  hideable: boolean
  defaultVisible: boolean
  headClass?: string
  cellClass?: string
  /**
   * Clases de columna fija durante el scroll horizontal (Cod y Acción).
   * Se aplican tanto al encabezado como a la celda.
   */
  stickyClass?: string
  /**
   * Valor completo para el tooltip nativo (`title`). Su presencia marca la
   * columna como truncable: la celda recibe `max-w-[220px] truncate`, así
   * solo se acortan textos realmente largos.
   */
  cellTitle?: (ctx: CeldaCtx) => string | undefined
  renderCell: (ctx: CeldaCtx) => React.ReactNode
}

const COLUMNAS: ColumnaDef[] = [
  {
    key: 'numero',
    label: 'Cod',
    hideable: false,
    defaultVisible: true,
    stickyClass:
      'sticky left-0 z-10 bg-card group-hover:bg-gray-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]',
    renderCell: ({ pedido, basePath }) => (
      <Link
        href={`${basePath}/${pedido.id}`}
        className="font-semibold text-[#00359a] hover:underline"
      >
        {pedido.numero}
      </Link>
    ),
  },
  {
    key: 'pvc',
    label: 'Exportado',
    hideable: true,
    defaultVisible: false,
    renderCell: ({ pedido }) => pedido.pvc ?? '—',
  },
  {
    key: 'estadoCredito',
    label: 'Estado',
    hideable: true,
    defaultVisible: false,
    renderCell: ({ pedido }) => (
      <EstadoCreditoBadge estadoCredito={pedido.estadoCredito} />
    ),
  },
  {
    key: 'formaPago',
    label: 'Forma pago',
    hideable: true,
    defaultVisible: false,
    cellTitle: ({ pedido }) => pedido.formaPago,
    renderCell: ({ pedido }) => pedido.formaPago,
  },
  {
    key: 'plazoCodigo',
    label: 'Plazo',
    hideable: true,
    defaultVisible: false,
    cellTitle: ({ pedido }) => plazoLabel(pedido.plazoCodigo),
    renderCell: ({ pedido }) => plazoLabel(pedido.plazoCodigo),
  },
  {
    key: 'estado',
    label: 'Estado',
    hideable: true,
    defaultVisible: true,
    renderCell: ({ pedido }) => <EstadoBadge estado={pedido.estado} />,
  },
  {
    key: 'fechaSolicitud',
    label: 'Solicitado',
    hideable: true,
    defaultVisible: true,
    cellClass: 'whitespace-nowrap',
    renderCell: ({ pedido }) =>
      pedido.fechaSolicitud
        ? formatFecha(pedido.fechaSolicitud.slice(0, 10))
        : '—',
  },
  {
    key: 'clienteNombre',
    label: 'Tercero',
    hideable: true,
    defaultVisible: true,
    cellTitle: ({ pedido }) => pedido.clienteNombre,
    renderCell: ({ pedido }) => pedido.clienteNombre,
  },
  {
    key: 'clienteId',
    label: 'Cod cliente',
    hideable: true,
    defaultVisible: false,
    renderCell: ({ pedido }) => pedido.clienteId,
  },
  {
    key: 'puntoEntrega',
    label: 'Entrega',
    hideable: true,
    defaultVisible: true,
    cellTitle: ({ sede }) => sede?.nombre,
    renderCell: ({ sede }) => sede?.nombre ?? '—',
  },
  {
    key: 'creadorEmail',
    label: 'Creador',
    hideable: true,
    defaultVisible: false,
    cellClass: 'text-muted-foreground',
    cellTitle: ({ pedido }) => pedido.creadorEmail,
    renderCell: ({ pedido }) => pedido.creadorEmail,
  },
  {
    key: 'solicitados',
    label: 'Solicitados',
    hideable: true,
    defaultVisible: true,
    headClass: 'text-right',
    cellClass: 'text-right tabular-nums',
    renderCell: ({ pedido }) => totalUnidades(pedido),
  },
  {
    key: 'total',
    label: 'Total',
    hideable: true,
    defaultVisible: true,
    headClass: 'text-right',
    cellClass: 'whitespace-nowrap text-right font-semibold tabular-nums',
    renderCell: ({ total }) => formatCOP(total),
  },
  {
    key: 'moneda',
    label: 'Moneda',
    hideable: true,
    defaultVisible: false,
    renderCell: ({ pedido }) => pedido.moneda,
  },
  {
    key: 'accion',
    label: 'Acción',
    hideable: false,
    defaultVisible: true,
    stickyClass:
      'sticky right-0 z-10 bg-card group-hover:bg-gray-50 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.12)]',
    headClass: 'text-right',
    cellClass: 'text-right',
    renderCell: ({ pedido, basePath }) => (
      <AccionLink pedido={pedido} basePath={basePath} />
    ),
  },
]

const VISIBILIDAD_DEFAULT = Object.fromEntries(
  COLUMNAS.map((c) => [c.key, c.defaultVisible]),
) as VisibilidadColumnas

export function ListadoPedidos({
  modo,
  basePath,
  estadoInicial,
}: ListadoPedidosProps) {
  const { pedidos, getProducto, getPuntoEntrega } = usePortal()
  const [estado, setEstado] = React.useState<FiltroEstado>(
    estadoInicial ?? 'todos',
  )
  const [clienteId, setClienteId] = React.useState<string>('todos')
  const [pvcQuery, setPvcQuery] = React.useState('')
  const [plazo, setPlazo] = React.useState<string>('todos')
  const [desde, setDesde] = React.useState<string | null>(null)
  const [hasta, setHasta] = React.useState<string | null>(null)

  // Visibilidad de columnas: preferencia por modo en localStorage. Se lee
  // tras montar (patrón del sidebar) para evitar hydration mismatch.
  const storageKey = `listado-columnas-${modo}`
  const [visibles, setVisibles] =
    React.useState<VisibilidadColumnas>(VISIBILIDAD_DEFAULT)

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      setVisibles(VISIBILIDAD_DEFAULT)
      return
    }
    try {
      const parsed = JSON.parse(stored) as Partial<VisibilidadColumnas>
      // Merge sobre defaults (tolera columnas nuevas) y fuerza las fijas.
      setVisibles({
        ...VISIBILIDAD_DEFAULT,
        ...parsed,
        numero: true,
        accion: true,
      })
    } catch {
      setVisibles(VISIBILIDAD_DEFAULT)
    }
  }, [storageKey])

  const toggleColumna = (key: ColumnaKey, checked: boolean) => {
    const next = { ...visibles, [key]: checked }
    setVisibles(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const restablecerColumnas = () => {
    localStorage.removeItem(storageKey)
    setVisibles(VISIBILIDAD_DEFAULT)
  }

  const columnasVisibles = COLUMNAS.filter((c) => visibles[c.key])

  // `items` permite que el trigger del select muestre el label, no el value.
  const estadoItems = React.useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e] })),
    ],
    [],
  )
  const plazoItems = React.useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...PLAZOS.map((p) => ({ value: p.codigo, label: `${p.codigo} : ${p.nombre}` })),
    ],
    [],
  )

  const filtrados = React.useMemo(() => {
    const q = pvcQuery.trim().toLowerCase()
    return pedidos
      .filter((p) => {
        if (estado !== 'todos' && p.estado !== estado) return false
        if (clienteId !== 'todos' && p.clienteId !== clienteId) return false
        if (plazo !== 'todos' && p.plazoCodigo !== plazo) return false
        if (q && !(p.pvc ?? '').toLowerCase().includes(q)) return false
        const fecha = p.fechaCreacion.slice(0, 10)
        if (desde && fecha < desde) return false
        if (hasta && fecha > hasta) return false
        return true
      })
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  }, [pedidos, estado, clienteId, plazo, pvcQuery, desde, hasta])

  const hayFiltros =
    estado !== 'todos' ||
    clienteId !== 'todos' ||
    plazo !== 'todos' ||
    pvcQuery.trim() !== '' ||
    desde !== null ||
    hasta !== null

  const limpiarFiltros = () => {
    setEstado('todos')
    setClienteId('todos')
    setPlazo('todos')
    setPvcQuery('')
    setDesde(null)
    setHasta(null)
  }

  const ctxDe = (pedido: Pedido): CeldaCtx => ({
    pedido,
    sede: puntoDePedido(pedido, getPuntoEntrega),
    total: totalesPedido(pedido, getProducto).total,
    basePath,
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de filtros + selector de columnas */}
      <Card className="rounded-xl border p-4">
        <div className="flex flex-wrap items-end gap-2">
        <FiltroCampo label="Estado">
          <Select
            items={estadoItems}
            value={estado}
            onValueChange={(v) => setEstado((v ?? 'todos') as FiltroEstado)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCampo>

        <FiltroCampo label="Cliente">
          <ClienteCombobox
            value={clienteId}
            onChange={setClienteId}
            includeAll
            className="w-52"
          />
        </FiltroCampo>

        <FiltroCampo label="Desde">
          <DatePicker
            value={desde}
            onChange={setDesde}
            compact
            permitirPasadas
            placeholder="Cualquier fecha"
          />
        </FiltroCampo>

        <FiltroCampo label="Hasta">
          <DatePicker
            value={hasta}
            onChange={setHasta}
            compact
            permitirPasadas
            placeholder="Cualquier fecha"
          />
        </FiltroCampo>

        <FiltroCampo label="PVC">
          <InputGroup className="w-44">
            <InputGroupInput
              placeholder="Buscar PVC…"
              value={pvcQuery}
              onChange={(e) => setPvcQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </FiltroCampo>

        <FiltroCampo label="Plazo">
          <Select
            items={plazoItems}
            value={plazo}
            onValueChange={(v) => setPlazo(v ?? 'todos')}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {PLAZOS.map((p) => (
                <SelectItem key={p.codigo} value={p.codigo}>
                  {p.codigo} : {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCampo>

        <div className="ml-auto flex items-center gap-2">
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Configurar columnas visibles"
                  className="gap-2"
                />
              }
            >
              <Columns3 className="size-4" />
              Columnas
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Columnas visibles
                </span>
                {COLUMNAS.filter((c) => c.hideable).map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={visibles[c.key]}
                      onCheckedChange={(checked) =>
                        toggleColumna(c.key, Boolean(checked))
                      }
                      aria-label={`Mostrar columna ${c.label}`}
                    />
                    {c.label}
                  </label>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restablecerColumnas}
                  className="mt-1 self-start"
                >
                  Restablecer
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>
      </Card>

      {/* Contador de resultados */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {filtrados.length}
        </span>{' '}
        pedidos encontrados
      </p>

      {/* Tabla en desktop, enfoque híbrido: ancho natural con un mínimo para
          que el contenido respire; si el viewport es más angosto aparece el
          scroll horizontal (el contenedor del componente Table ya lo trae) y
          Cod/Acción quedan fijas para no perder identificador ni acción. */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table className="w-full min-w-[1050px]">
          <TableHeader>
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              {columnasVisibles.map((c) => (
                <TableHead
                  key={c.key}
                  className={`px-2 py-2 text-[11px] font-semibold uppercase whitespace-nowrap text-muted-foreground ${c.stickyClass ?? ''} ${c.headClass ?? ''}`}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columnasVisibles.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No hay pedidos para estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((pedido) => {
                const ctx = ctxDe(pedido)
                return (
                  <TableRow key={pedido.id} className="group hover:bg-gray-50">
                    {columnasVisibles.map((c) => (
                      <TableCell
                        key={c.key}
                        title={c.cellTitle?.(ctx)}
                        className={`px-2 py-2 text-xs ${
                          c.cellTitle ? 'max-w-[220px] truncate' : ''
                        } ${c.stickyClass ?? ''} ${c.cellClass ?? ''}`}
                      >
                        {c.renderCell(ctx)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Tarjetas en móvil */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtrados.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            No hay pedidos para estos filtros.
          </Card>
        ) : (
          filtrados.map((pedido) => (
            <PedidoCardMovil
              key={pedido.id}
              ctx={ctxDe(pedido)}
              visibles={visibles}
            />
          ))
        )}
      </div>
    </div>
  )
}

function FiltroCampo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** Acción según estado (replica la pantalla real): borrador → Editar, resto → Ver. */
function AccionLink({
  pedido,
  basePath,
}: {
  pedido: Pedido
  basePath: string
}) {
  const esBorrador = pedido.estado === 'en_construccion'
  return (
    <Link
      href={`${basePath}/${pedido.id}`}
      className="inline-flex items-center gap-1 text-sm font-medium text-[#ff6600] hover:underline"
    >
      {esBorrador ? (
        <Pencil className="size-3.5" />
      ) : (
        <Eye className="size-3.5" />
      )}
      {esBorrador ? 'Editar' : 'Ver'}
    </Link>
  )
}

/** Claves que la tarjeta móvil muestra en la grilla secundaria. */
const SECUNDARIAS_MOVIL: ColumnaKey[] = [
  'pvc',
  'estadoCredito',
  'formaPago',
  'plazoCodigo',
  'clienteId',
  'puntoEntrega',
  'creadorEmail',
  'solicitados',
  'moneda',
]

function PedidoCardMovil({
  ctx,
  visibles,
}: {
  ctx: CeldaCtx
  visibles: VisibilidadColumnas
}) {
  const { pedido, sede, total, basePath } = ctx
  const haySecundarias = SECUNDARIAS_MOVIL.some((k) => visibles[k])

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[#00359a]">{pedido.numero}</span>
        {visibles.estado && <EstadoBadge estado={pedido.estado} />}
      </div>
      {(visibles.clienteNombre || visibles.fechaSolicitud) && (
        <div className="flex flex-col gap-1 text-sm">
          {visibles.clienteNombre && (
            <span className="font-medium">{pedido.clienteNombre}</span>
          )}
          {visibles.fechaSolicitud && (
            <span className="text-muted-foreground">
              {pedido.fechaSolicitud
                ? `Solicitado: ${formatFecha(pedido.fechaSolicitud.slice(0, 10))}`
                : 'Sin solicitar'}
            </span>
          )}
        </div>
      )}
      {haySecundarias && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {visibles.pvc && <span>Exportado: {pedido.pvc ?? '—'}</span>}
          {visibles.estadoCredito && (
            <span className="flex items-center gap-1">
              Crédito: <EstadoCreditoBadge estadoCredito={pedido.estadoCredito} />
            </span>
          )}
          {visibles.formaPago && <span>{pedido.formaPago}</span>}
          {visibles.plazoCodigo && <span>{plazoLabel(pedido.plazoCodigo)}</span>}
          {visibles.clienteId && <span>Cod cliente: {pedido.clienteId}</span>}
          {visibles.puntoEntrega && (
            <span className="col-span-2 truncate">
              Punto: {sede?.nombre ?? '—'}
            </span>
          )}
          {visibles.creadorEmail && (
            <span className="col-span-2 truncate">
              Creador: {pedido.creadorEmail}
            </span>
          )}
          {visibles.solicitados && (
            <span>Solicitados: {totalUnidades(pedido)}</span>
          )}
          {visibles.moneda && <span>Moneda: {pedido.moneda}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        {visibles.total ? (
          <span className="font-bold tabular-nums text-primary">
            {formatCOP(total)}
          </span>
        ) : (
          <span />
        )}
        <AccionLink pedido={pedido} basePath={basePath} />
      </div>
    </Card>
  )
}
