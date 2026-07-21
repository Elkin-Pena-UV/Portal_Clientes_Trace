import type {
  AccionBitacora,
  EventoBitacora,
  Pedido,
  Producto,
  PuntoEntrega,
  Sede,
} from './types'
import {
  BODEGA_DEFAULT,
  MOTIVO_VENTA_DEFAULT,
  MOTIVO_VENTA_LABEL,
  PLAZOS,
  contactoEntregaVacio,
  contactoRetiraVacio,
  despachoVacio,
} from './types'
import { formatFecha } from './format'
import { clienteActualMock } from './mock-data'

export interface Totales {
  neto: number
  iva: number
  total: number
}

type ProductoResolver = (id: string) => Producto | undefined

/** Calcula subtotal neto, IVA y total de una línea de producto. */
export function calcularLinea(producto: Producto, cantidad: number): Totales {
  const neto = producto.precio * cantidad
  const iva = neto * producto.iva
  return { neto, iva, total: neto + iva }
}

/** Suma los totales de todas las líneas de un pedido. */
export function totalesPedido(pedido: Pedido, resolve: ProductoResolver): Totales {
  return pedido.items.reduce<Totales>(
    (acc, item) => {
      const producto = resolve(item.productoId)
      if (!producto) return acc
      const linea = calcularLinea(producto, item.cantidad)
      return {
        neto: acc.neto + linea.neto,
        iva: acc.iva + linea.iva,
        total: acc.total + linea.total,
      }
    },
    { neto: 0, iva: 0, total: 0 },
  )
}

/** Suma los totales combinados de varios pedidos. */
export function totalesGlobales(pedidos: Pedido[], resolve: ProductoResolver): Totales {
  return pedidos.reduce<Totales>(
    (acc, pedido) => {
      const t = totalesPedido(pedido, resolve)
      return {
        neto: acc.neto + t.neto,
        iva: acc.iva + t.iva,
        total: acc.total + t.total,
      }
    },
    { neto: 0, iva: 0, total: 0 },
  )
}

/**
 * Id único para una línea de pedido. Cada línea tiene identidad propia:
 * el mismo producto puede repetirse en varias líneas (despachos distintos).
 */
export function nuevoItemId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Fecha de hoy a medianoche local (para validar fechas no anteriores a hoy). */
export function hoyInicio(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Todos los items tienen una fecha de entrega asignada. */
export function fechasCompletas(pedido: Pedido): boolean {
  return pedido.items.every((i) => !!i.fechaEntrega)
}

/**
 * Genera el número de un borrador, con prefijo T_ (ej: "T_301740").
 * El consecutivo definitivo (sin prefijo) se asigna en `solicitarPedido`.
 */
export function generarNumeroPedido(): string {
  const seq = Math.floor(100000 + Math.random() * 900000)
  return `T_${seq}`
}

export function nuevoPedido(): Pedido {
  return {
    id: Math.random().toString(36).slice(2, 10),
    numero: generarNumeroPedido(),
    estado: 'en_construccion',
    pvc: null,
    estadoCredito: 'sin_aprobar',
    formaPago: 'Crédito',
    // El plazo viene del maestro del cliente; '30D' si no tiene definido.
    plazoCodigo: clienteActualMock.plazoCodigo || '30D',
    clienteId: clienteActualMock.clienteId,
    clienteNombre: clienteActualMock.clienteNombre,
    fechaCreacion: new Date().toISOString(),
    fechaSolicitud: null,
    creadorEmail: clienteActualMock.email,
    moneda: 'COP',
    tipoProducto: null,
    metodoDespacho: null,
    despacho: despachoVacio(),
    contactoEntrega: contactoEntregaVacio(),
    contactoRetira: contactoRetiraVacio(),
    items: [],
    sedeFacturaId: null,
    bodegaCodigo: BODEGA_DEFAULT,
    motivoVenta: MOTIVO_VENTA_DEFAULT,
    bitacora: [],
  }
}

/** Crea un nuevo pedido copiando los datos de despacho/contacto del anterior. */
export function clonarPedido(prev: Pedido): Pedido {
  return {
    id: Math.random().toString(36).slice(2, 10),
    numero: generarNumeroPedido(),
    estado: 'en_construccion',
    pvc: null,
    // Condiciones comerciales del cliente: se heredan del pedido anterior.
    estadoCredito: prev.estadoCredito,
    formaPago: prev.formaPago,
    plazoCodigo: prev.plazoCodigo,
    clienteId: prev.clienteId,
    clienteNombre: prev.clienteNombre,
    fechaCreacion: new Date().toISOString(),
    fechaSolicitud: null,
    creadorEmail: prev.creadorEmail,
    moneda: prev.moneda,
    tipoProducto: prev.tipoProducto,
    metodoDespacho: prev.metodoDespacho,
    despacho: { ...prev.despacho },
    contactoEntrega: { ...prev.contactoEntrega },
    contactoRetira: { ...prev.contactoRetira },
    items: [],
    // La sede factura la asigna SAC por pedido: no se hereda del anterior.
    sedeFacturaId: null,
    // Bodega y motivo los ajusta logística por pedido: arrancan en su default.
    bodegaCodigo: BODEGA_DEFAULT,
    motivoVenta: MOTIVO_VENTA_DEFAULT,
    // La bitácora es propia de cada pedido: el clon arranca la suya vacía.
    bitacora: [],
  }
}

/**
 * Label de un plazo con el formato del sistema actual: "30D : CREDITO 30 DIAS".
 * Si el código no existe en el catálogo, devuelve el código crudo.
 */
export function plazoLabel(codigo: string): string {
  const plazo = PLAZOS.find((p) => p.codigo === codigo)
  return plazo ? `${plazo.codigo} : ${plazo.nombre}` : codigo
}

/** Crea un evento de bitácora fechado en este instante. */
export function nuevoEvento(
  accion: AccionBitacora,
  usuario: string,
  detalle: string,
  adjuntos: string[] = [],
): EventoBitacora {
  return {
    id: Math.random().toString(36).slice(2, 10),
    fecha: new Date().toISOString(),
    accion,
    usuario,
    detalle,
    adjuntos,
  }
}

/** Resolvedores de catálogos para armar el resumen de cambios legible. */
export interface ResolversResumen {
  producto: ProductoResolver
  sede?: (id: string) => Sede | undefined
  punto?: (id: string) => PuntoEntrega | undefined
}

/**
 * Resumen legible de QUÉ cambió entre un pedido y su patch, para el evento
 * 'documento_modificado' de la bitácora. Ej:
 * "Plazo: 30D → 60D | Bodega: EMP01 → SCART | Cantidad COD-0042: 45 → 60".
 * Cadena vacía si no hay diferencias (no se debe registrar evento).
 */
export function resumenCambios(
  prev: Pedido,
  patch: Partial<Pedido>,
  resolvers: ResolversResumen,
): string {
  const cambios: string[] = []
  const nombreSede = (id: string | null) =>
    id ? (resolvers.sede?.(id)?.nombre ?? id) : 'Sin asignar'
  const nombrePunto = (id: string) =>
    id ? (resolvers.punto?.(id)?.nombre ?? id) : '—'
  const codigoProducto = (id: string) => resolvers.producto(id)?.codigo ?? id
  const metodo = (m: Pedido['metodoDespacho']) =>
    m === 'entregar' ? 'Entregar' : m === 'retira' ? 'Retira' : '—'
  const siNo = (v: boolean) => (v ? 'Sí' : 'No')
  const fecha = (f: string | null) => (f ? formatFecha(f) : 'Sin fecha')

  if (
    patch.metodoDespacho !== undefined &&
    patch.metodoDespacho !== prev.metodoDespacho
  ) {
    cambios.push(
      `Método de despacho: ${metodo(prev.metodoDespacho)} → ${metodo(patch.metodoDespacho)}`,
    )
  }
  if (patch.despacho) {
    const a = prev.despacho
    const b = patch.despacho
    if (b.sedeId !== a.sedeId)
      cambios.push(
        `Sede: ${nombreSede(a.sedeId || null)} → ${nombreSede(b.sedeId || null)}`,
      )
    if (b.puntoEntregaId !== a.puntoEntregaId)
      cambios.push(
        `Punto de entrega: ${nombrePunto(a.puntoEntregaId)} → ${nombrePunto(b.puntoEntregaId)}`,
      )
    if (b.ordenCompra !== a.ordenCompra)
      cambios.push(`Orden de compra: ${a.ordenCompra || '—'} → ${b.ordenCompra || '—'}`)
    if (b.necesitaEstiba !== a.necesitaEstiba)
      cambios.push(`Estiba: ${siNo(a.necesitaEstiba)} → ${siNo(b.necesitaEstiba)}`)
    if (b.necesitaDescarga !== a.necesitaDescarga)
      cambios.push(`Descarga: ${siNo(a.necesitaDescarga)} → ${siNo(b.necesitaDescarga)}`)
    if (b.observaciones !== a.observaciones)
      cambios.push('Observaciones: actualizadas')
  }
  if (
    patch.contactoEntrega &&
    JSON.stringify(patch.contactoEntrega) !== JSON.stringify(prev.contactoEntrega)
  ) {
    cambios.push('Contacto de entrega: actualizado')
  }
  if (
    patch.contactoRetira &&
    JSON.stringify(patch.contactoRetira) !== JSON.stringify(prev.contactoRetira)
  ) {
    cambios.push('Contacto de retiro: actualizado')
  }
  if (
    patch.sedeFacturaId !== undefined &&
    patch.sedeFacturaId !== prev.sedeFacturaId
  ) {
    cambios.push(
      `Sede factura: ${nombreSede(prev.sedeFacturaId)} → ${nombreSede(patch.sedeFacturaId)}`,
    )
  }
  if (patch.bodegaCodigo && patch.bodegaCodigo !== prev.bodegaCodigo)
    cambios.push(`Bodega: ${prev.bodegaCodigo} → ${patch.bodegaCodigo}`)
  if (patch.motivoVenta && patch.motivoVenta !== prev.motivoVenta)
    cambios.push(
      `Motivo de venta: ${MOTIVO_VENTA_LABEL[prev.motivoVenta]} → ${MOTIVO_VENTA_LABEL[patch.motivoVenta]}`,
    )
  if (patch.plazoCodigo && patch.plazoCodigo !== prev.plazoCodigo)
    cambios.push(`Plazo: ${prev.plazoCodigo} → ${patch.plazoCodigo}`)

  if (patch.items) {
    const antesPorId = new Map(prev.items.map((i) => [i.id, i]))
    const idsNuevos = new Set(patch.items.map((i) => i.id))
    const agregadas: string[] = []
    for (const item of patch.items) {
      const antes = antesPorId.get(item.id)
      if (!antes) {
        agregadas.push(codigoProducto(item.productoId))
        continue
      }
      const codigo = codigoProducto(item.productoId)
      if (item.cantidad !== antes.cantidad)
        cambios.push(`Cantidad ${codigo}: ${antes.cantidad} → ${item.cantidad}`)
      if (item.fechaEntrega !== antes.fechaEntrega)
        cambios.push(
          `Fecha ${codigo}: ${fecha(antes.fechaEntrega)} → ${fecha(item.fechaEntrega)}`,
        )
    }
    const eliminadas = prev.items
      .filter((i) => !idsNuevos.has(i.id))
      .map((i) => codigoProducto(i.productoId))
    const lineas = (n: number) => (n === 1 ? 'línea' : 'líneas')
    const partes: string[] = []
    if (agregadas.length)
      partes.push(`+${agregadas.length} ${lineas(agregadas.length)} (${agregadas.join(', ')})`)
    if (eliminadas.length)
      partes.push(`-${eliminadas.length} ${lineas(eliminadas.length)} (${eliminadas.join(', ')})`)
    if (partes.length) cambios.push(`Productos: ${partes.join(', ')}`)
  }

  return cambios.join(' | ')
}

export function totalUnidades(pedido: Pedido): number {
  return pedido.items.reduce((acc, item) => acc + item.cantidad, 0)
}

export function despachoCompleto(pedido: Pedido): boolean {
  // Bloque común: aplica igual para cualquier método.
  const d = pedido.despacho
  const comunCompleto =
    !!d.sedeId && !!d.puntoEntregaId && !!d.ordenCompra.trim()
  if (!comunCompleto) return false

  // Según el método, solo se valida su bloque de contacto.
  if (pedido.metodoDespacho === 'entregar') {
    const c = pedido.contactoEntrega
    return (
      !!c.nombreRecibe.trim() &&
      /^\d{10}$/.test(c.celular) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo)
    )
  }
  if (pedido.metodoDespacho === 'retira') {
    const c = pedido.contactoRetira
    return (
      !!c.nombreConductor.trim() &&
      /^\d{6,10}$/.test(c.cedula) &&
      /^[A-Z]{3}\d{3}$/.test(c.placa) &&
      /^\d{10}$/.test(c.celular)
    )
  }
  return false
}

/** Requisito pendiente que impide aprobar; `mensaje` se muestra en el botón. */
export interface BloqueoAprobacion {
  campo: string
  mensaje: string
}

/**
 * Bloqueos activos para aprobar un pedido, en orden de prioridad: el primero
 * es el label del botón Aprobar deshabilitado. Lista vacía = puede aprobarse.
 */
export function bloqueosAprobacion(pedido: Pedido): BloqueoAprobacion[] {
  const bloqueos: BloqueoAprobacion[] = []
  if (pedido.sedeFacturaId == null)
    bloqueos.push({
      campo: 'sedeFactura',
      mensaje: 'Completa la sede de factura para aprobar',
    })
  if (pedido.items.length === 0)
    bloqueos.push({
      campo: 'productos',
      mensaje: 'Agrega al menos un producto para aprobar',
    })
  if (pedido.items.some((i) => !(i.cantidad > 0)))
    bloqueos.push({
      campo: 'cantidades',
      mensaje: 'Corrige las cantidades para aprobar',
    })
  if (!despachoCompleto(pedido))
    bloqueos.push({
      campo: 'despacho',
      mensaje: 'Completa los datos de despacho para aprobar',
    })
  return bloqueos
}

export function pedidoCompleto(pedido: Pedido): boolean {
  return (
    pedido.tipoProducto !== null &&
    pedido.metodoDespacho !== null &&
    despachoCompleto(pedido) &&
    pedido.items.length > 0 &&
    fechasCompletas(pedido)
  )
}

export type StepStatus = 'complete' | 'current' | 'pending'

/** Devuelve el índice del primer paso incompleto (0-3) para un pedido. */
export function pasoActual(pedido: Pedido): number {
  if (pedido.tipoProducto === null) return 0
  if (pedido.metodoDespacho === null || !despachoCompleto(pedido)) return 1
  if (pedido.items.length === 0 || !fechasCompletas(pedido)) return 2
  return 3
}
