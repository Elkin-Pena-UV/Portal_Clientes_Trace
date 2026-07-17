'use client'

import * as React from 'react'
import type { Pedido, Producto, PuntoEntrega, Rol, Sede } from '@/lib/types'
import {
  pedidosMock,
  productosMock,
  puntosEntregaMock,
  sedesMock,
} from '@/lib/mock-data'

interface PortalContextValue {
  /** Rol activo de la sesión (mock, se cambia con el switcher de desarrollo). */
  rol: Rol
  setRol: (rol: Rol) => void
  sedes: Sede[]
  productos: Producto[]
  /** Store central de pedidos (todas las vistas leen de aquí). */
  pedidos: Pedido[]
  /** Transición 'en_construccion' → 'solicitado'. Ignora otros estados. */
  solicitarPedido: (id: string) => void
  /** Transición 'solicitado' → 'aprobado'. Ignora otros estados. */
  aprobarPedido: (id: string) => void
  /** Transición 'solicitado' → 'rechazado'. Ignora otros estados. */
  rechazarPedido: (id: string) => void
  /** Actualiza campos de un pedido. El estado solo cambia vía las transiciones. */
  actualizarPedido: (id: string, patch: Partial<Pedido>) => void
  getPedido: (id: string) => Pedido | undefined
  /** Catálogo de sedes (plantas de despacho) y su CRUD. */
  addSede: (sede: Omit<Sede, 'id'>) => void
  updateSede: (id: string, sede: Omit<Sede, 'id'>) => void
  deleteSede: (id: string) => void
  getSede: (id: string) => Sede | undefined
  /** Catálogo de puntos de entrega del cliente y su CRUD. */
  puntosEntrega: PuntoEntrega[]
  addPuntoEntrega: (punto: Omit<PuntoEntrega, 'id'>) => void
  updatePuntoEntrega: (id: string, punto: Omit<PuntoEntrega, 'id'>) => void
  deletePuntoEntrega: (id: string) => void
  getPuntoEntrega: (id: string) => PuntoEntrega | undefined
  getProducto: (id: string) => Producto | undefined
  /** Lote de pedidos importados desde Excel, pendiente de cargar en el constructor. */
  setBorradorImportado: (pedidos: Pedido[]) => void
  /** Devuelve y limpia el lote importado (uso único al abrir "Crear pedido"). */
  consumirBorradorImportado: () => Pedido[] | null
  /** Espejo en vivo del borrador del pedido en construcción (para preservarlo al navegar). */
  mirrorBorradorPedidos: (pedidos: Pedido[]) => void
  /**
   * Solicita crear un nuevo punto de entrega desde el flujo de pedido: marca
   * que al volver se debe restaurar el borrador y que la página de Puntos de
   * entrega debe abrir el formulario con la sede de despacho pre-seleccionada.
   */
  solicitarCrearPuntoEntrega: (sedeDespachoId: string) => void
  /**
   * La página de Puntos de entrega consume esto en su montaje: null si no hay
   * solicitud pendiente; si la hay, trae la sede a pre-seleccionar (puede ser '').
   */
  consumirAbrirNuevoPunto: () => { sedeDespachoId: string } | null
  /** El constructor consume esto al volver para restaurar el borrador preservado. */
  consumirRestaurarBorrador: () => Pedido[] | null
}

const PortalContext = React.createContext<PortalContextValue | null>(null)

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// Contador mock del consecutivo de pedidos solicitados (estilo pantalla real,
// ej. 269554). Arranca por encima de los números sembrados en mock-data.
let consecutivoMock = 269560

function siguienteConsecutivo(): string {
  consecutivoMock += 1
  return String(consecutivoMock)
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRol] = React.useState<Rol>('cliente')
  const [sedes, setSedes] = React.useState<Sede[]>(sedesMock)
  const [puntosEntrega, setPuntosEntrega] =
    React.useState<PuntoEntrega[]>(puntosEntregaMock)
  const [productos] = React.useState<Producto[]>(productosMock)
  const [pedidos, setPedidos] = React.useState<Pedido[]>(pedidosMock)
  const borradorRef = React.useRef<Pedido[] | null>(null)
  // Espejo del borrador en construcción + banderas para el flujo "crear punto".
  const borradorPedidosRef = React.useRef<Pedido[] | null>(null)
  const abrirNuevoPuntoRef = React.useRef<{ sedeDespachoId: string } | null>(null)
  const restaurarBorradorRef = React.useRef(false)

  const setBorradorImportado = React.useCallback((pedidos: Pedido[]) => {
    borradorRef.current = pedidos
  }, [])

  const consumirBorradorImportado = React.useCallback(() => {
    const b = borradorRef.current
    borradorRef.current = null
    return b
  }, [])

  const mirrorBorradorPedidos = React.useCallback((pedidos: Pedido[]) => {
    borradorPedidosRef.current = pedidos
  }, [])

  const solicitarCrearPuntoEntrega = React.useCallback(
    (sedeDespachoId: string) => {
      abrirNuevoPuntoRef.current = { sedeDespachoId }
      restaurarBorradorRef.current = true
    },
    [],
  )

  const consumirAbrirNuevoPunto = React.useCallback(() => {
    const v = abrirNuevoPuntoRef.current
    abrirNuevoPuntoRef.current = null
    return v
  }, [])

  const consumirRestaurarBorrador = React.useCallback(() => {
    if (!restaurarBorradorRef.current) return null
    restaurarBorradorRef.current = false
    return borradorPedidosRef.current
  }, [])

  const solicitarPedido = React.useCallback((id: string) => {
    setPedidos((prev) =>
      prev.map((p): Pedido =>
        p.id === id && p.estado === 'en_construccion'
          ? {
              ...p,
              estado: 'solicitado',
              // El borrador (T_xxxxxx) recibe su consecutivo definitivo.
              numero: siguienteConsecutivo(),
              fechaSolicitud: new Date().toISOString(),
            }
          : p,
      ),
    )
  }, [])

  const aprobarPedido = React.useCallback((id: string) => {
    setPedidos((prev) =>
      prev.map((p): Pedido =>
        p.id === id && p.estado === 'solicitado'
          ? { ...p, estado: 'aprobado' }
          : p,
      ),
    )
  }, [])

  const rechazarPedido = React.useCallback((id: string) => {
    setPedidos((prev) =>
      prev.map((p): Pedido =>
        p.id === id && p.estado === 'solicitado'
          ? { ...p, estado: 'rechazado' }
          : p,
      ),
    )
  }, [])

  const actualizarPedido = React.useCallback(
    (id: string, patch: Partial<Pedido>) => {
      // Las transiciones de estado solo ocurren vía solicitarPedido/aprobarPedido.
      const resto = { ...patch }
      delete resto.estado
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...resto } : p)))
    },
    [],
  )

  const getPedido = React.useCallback(
    (id: string) => pedidos.find((p) => p.id === id),
    [pedidos],
  )

  const addSede = React.useCallback((sede: Omit<Sede, 'id'>) => {
    setSedes((prev) => [{ ...sede, id: uid() }, ...prev])
  }, [])

  const updateSede = React.useCallback(
    (id: string, sede: Omit<Sede, 'id'>) => {
      setSedes((prev) => prev.map((s) => (s.id === id ? { ...sede, id } : s)))
    },
    [],
  )

  const deleteSede = React.useCallback((id: string) => {
    setSedes((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const getSede = React.useCallback(
    (id: string) => sedes.find((s) => s.id === id),
    [sedes],
  )

  const addPuntoEntrega = React.useCallback(
    (punto: Omit<PuntoEntrega, 'id'>) => {
      setPuntosEntrega((prev) => [{ ...punto, id: uid() }, ...prev])
    },
    [],
  )

  const updatePuntoEntrega = React.useCallback(
    (id: string, punto: Omit<PuntoEntrega, 'id'>) => {
      setPuntosEntrega((prev) =>
        prev.map((p) => (p.id === id ? { ...punto, id } : p)),
      )
    },
    [],
  )

  const deletePuntoEntrega = React.useCallback((id: string) => {
    setPuntosEntrega((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getPuntoEntrega = React.useCallback(
    (id: string) => puntosEntrega.find((p) => p.id === id),
    [puntosEntrega],
  )

  const getProducto = React.useCallback(
    (id: string) => productos.find((p) => p.id === id),
    [productos],
  )

  const value = React.useMemo(
    () => ({
      rol,
      setRol,
      sedes,
      productos,
      pedidos,
      solicitarPedido,
      aprobarPedido,
      rechazarPedido,
      actualizarPedido,
      getPedido,
      addSede,
      updateSede,
      deleteSede,
      getSede,
      puntosEntrega,
      addPuntoEntrega,
      updatePuntoEntrega,
      deletePuntoEntrega,
      getPuntoEntrega,
      getProducto,
      setBorradorImportado,
      consumirBorradorImportado,
      mirrorBorradorPedidos,
      solicitarCrearPuntoEntrega,
      consumirAbrirNuevoPunto,
      consumirRestaurarBorrador,
    }),
    [
      rol,
      setRol,
      sedes,
      productos,
      pedidos,
      solicitarPedido,
      aprobarPedido,
      rechazarPedido,
      actualizarPedido,
      getPedido,
      addSede,
      updateSede,
      deleteSede,
      getSede,
      puntosEntrega,
      addPuntoEntrega,
      updatePuntoEntrega,
      deletePuntoEntrega,
      getPuntoEntrega,
      getProducto,
      setBorradorImportado,
      consumirBorradorImportado,
      mirrorBorradorPedidos,
      solicitarCrearPuntoEntrega,
      consumirAbrirNuevoPunto,
      consumirRestaurarBorrador,
    ],
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const ctx = React.useContext(PortalContext)
  if (!ctx) throw new Error('usePortal debe usarse dentro de PortalProvider')
  return ctx
}
