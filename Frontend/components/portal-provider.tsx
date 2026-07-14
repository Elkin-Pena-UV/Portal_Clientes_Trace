'use client'

import * as React from 'react'
import type { Pedido, Producto, Rol, Sede } from '@/lib/types'
import { pedidosMock, productosMock, sedesMock } from '@/lib/mock-data'

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
  /** Actualiza campos de un pedido. El estado solo cambia vía las transiciones. */
  actualizarPedido: (id: string, patch: Partial<Pedido>) => void
  getPedido: (id: string) => Pedido | undefined
  addSede: (sede: Omit<Sede, 'id'>) => void
  updateSede: (id: string, sede: Omit<Sede, 'id'>) => void
  deleteSede: (id: string) => void
  getSede: (id: string) => Sede | undefined
  getProducto: (id: string) => Producto | undefined
  /** Lote de pedidos importados desde Excel, pendiente de cargar en el constructor. */
  setBorradorImportado: (pedidos: Pedido[]) => void
  /** Devuelve y limpia el lote importado (uso único al abrir "Crear pedido"). */
  consumirBorradorImportado: () => Pedido[] | null
  /** Espejo en vivo del borrador del pedido en construcción (para preservarlo al navegar). */
  mirrorBorradorPedidos: (pedidos: Pedido[]) => void
  /**
   * Solicita crear una nueva sede desde el flujo de pedido: marca que al volver
   * se debe restaurar el borrador y que la página de Sedes debe abrir el formulario.
   */
  solicitarCrearSede: () => void
  /** La página de Sedes consume esto en su montaje para abrir el formulario de creación. */
  consumirAbrirNuevaSede: () => boolean
  /** El constructor consume esto al volver para restaurar el borrador preservado. */
  consumirRestaurarBorrador: () => Pedido[] | null
}

const PortalContext = React.createContext<PortalContextValue | null>(null)

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRol] = React.useState<Rol>('cliente')
  const [sedes, setSedes] = React.useState<Sede[]>(sedesMock)
  const [productos] = React.useState<Producto[]>(productosMock)
  const [pedidos, setPedidos] = React.useState<Pedido[]>(pedidosMock)
  const borradorRef = React.useRef<Pedido[] | null>(null)
  // Espejo del borrador en construcción + banderas para el flujo "crear sede".
  const borradorPedidosRef = React.useRef<Pedido[] | null>(null)
  const abrirNuevaSedeRef = React.useRef(false)
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

  const solicitarCrearSede = React.useCallback(() => {
    abrirNuevaSedeRef.current = true
    restaurarBorradorRef.current = true
  }, [])

  const consumirAbrirNuevaSede = React.useCallback(() => {
    const v = abrirNuevaSedeRef.current
    abrirNuevaSedeRef.current = false
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
          ? { ...p, estado: 'solicitado' }
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
      actualizarPedido,
      getPedido,
      addSede,
      updateSede,
      deleteSede,
      getSede,
      getProducto,
      setBorradorImportado,
      consumirBorradorImportado,
      mirrorBorradorPedidos,
      solicitarCrearSede,
      consumirAbrirNuevaSede,
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
      actualizarPedido,
      getPedido,
      addSede,
      updateSede,
      deleteSede,
      getSede,
      getProducto,
      setBorradorImportado,
      consumirBorradorImportado,
      mirrorBorradorPedidos,
      solicitarCrearSede,
      consumirAbrirNuevaSede,
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
