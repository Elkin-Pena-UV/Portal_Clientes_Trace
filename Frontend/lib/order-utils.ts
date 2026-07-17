import type { Pedido, Producto } from './types'
import {
  contactoEntregaVacio,
  contactoRetiraVacio,
  despachoVacio,
} from './types'
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
    plazoCredito: 'Crédito 30 días',
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
    plazoCredito: prev.plazoCredito,
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
  }
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
