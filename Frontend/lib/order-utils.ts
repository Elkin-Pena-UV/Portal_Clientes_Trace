import type { Pedido, Producto } from './types'
import { datosEntregaVacios, datosRetiraVacios } from './types'

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

export function nuevoPedido(): Pedido {
  return {
    id: Math.random().toString(36).slice(2, 10),
    tipoProducto: null,
    metodoDespacho: null,
    datosEntrega: datosEntregaVacios(),
    datosRetira: datosRetiraVacios(),
    items: [],
  }
}

/** Crea un nuevo pedido copiando los datos de despacho/contacto del anterior. */
export function clonarPedido(prev: Pedido): Pedido {
  return {
    id: Math.random().toString(36).slice(2, 10),
    tipoProducto: prev.tipoProducto,
    metodoDespacho: prev.metodoDespacho,
    datosEntrega: { ...prev.datosEntrega },
    datosRetira: { ...prev.datosRetira },
    items: [],
  }
}

export function totalUnidades(pedido: Pedido): number {
  return pedido.items.reduce((acc, item) => acc + item.cantidad, 0)
}

export function despachoCompleto(pedido: Pedido): boolean {
  if (pedido.metodoDespacho === 'entregar') {
    const d = pedido.datosEntrega
    return (
      !!d.sedeId &&
      !!d.ordenCompra.trim() &&
      !!d.nombreRecibe.trim() &&
      /^\d{10}$/.test(d.celular) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)
    )
  }
  if (pedido.metodoDespacho === 'retira') {
    const d = pedido.datosRetira
    return (
      !!d.sedeId &&
      !!d.ordenCompra.trim() &&
      !!d.nombreConductor.trim() &&
      /^\d{6,10}$/.test(d.cedula) &&
      /^[A-Z]{3}\d{3}$/.test(d.placa) &&
      /^\d{10}$/.test(d.celular)
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
