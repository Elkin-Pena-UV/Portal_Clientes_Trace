'use client'

import * as React from 'react'
import type {
  Cliente,
  Pedido,
  Producto,
  PuntoEntrega,
  Rol,
  Sede,
} from '@/lib/types'
import {
  asesorServicioMock,
  clienteActualMock,
  clientesMock,
  pedidosMock,
  productosMock,
  puntosEntregaMock,
  sedesMock,
} from '@/lib/mock-data'
import { nuevoEvento, resumenCambios, totalesPedido } from '@/lib/order-utils'

interface PortalContextValue {
  /** Rol activo de la sesión (mock, se cambia con el switcher de desarrollo). */
  rol: Rol
  setRol: (rol: Rol) => void
  sedes: Sede[]
  productos: Producto[]
  /** Store central de pedidos (todas las vistas leen de aquí). */
  pedidos: Pedido[]
  /** Catálogo de clientes (terceros) con sus condiciones comerciales. */
  clientes: Cliente[]
  getCliente: (id: string) => Cliente | undefined
  /**
   * Inserta un pedido nuevo al inicio del store y devuelve su id. Si
   * `opts.solicitar`, lo deja en 'solicitado' con consecutivo real, fecha de
   * solicitud y los eventos de bitácora correspondientes (entra a la cola de
   * aprobación). Es el punto de creación que usa el flujo SAC ("Nuevo pedido").
   */
  crearPedido: (pedido: Pedido, opts?: { solicitar?: boolean }) => string
  /** Transición 'en_construccion' → 'solicitado'. Ignora otros estados. */
  solicitarPedido: (id: string) => void
  /** Transición 'solicitado' → 'aprobado'. Ignora otros estados. */
  aprobarPedido: (id: string) => void
  /** Transición 'solicitado' → 'rechazado', con motivo para la bitácora. Ignora otros estados. */
  rechazarPedido: (id: string, motivo: string) => void
  /** Elimina el pedido del store de forma permanente (junto con su bitácora). */
  eliminarPedido: (id: string) => void
  /** Registra un evento 'documento_mensaje' en la bitácora (envío de correo, etc.). */
  registrarMensajePedido: (id: string, detalle: string) => void
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

/**
 * Línea de detalle estilo sistema actual para los eventos de documento de la
 * bitácora: "CODIGO: X TOTAL: Y CLIENTE - PUNTO - CONTACTO --Nombre: ...".
 */
function detalleDocumento(
  p: Pedido,
  numero: string,
  total: number,
  punto: PuntoEntrega | undefined,
): string {
  const contacto =
    p.metodoDespacho === 'retira'
      ? {
          nombre: p.contactoRetira.nombreConductor,
          telefono: p.contactoRetira.celular,
          correo: '',
        }
      : {
          nombre: p.contactoEntrega.nombreRecibe,
          telefono: p.contactoEntrega.celular,
          correo: p.contactoEntrega.correo,
        }
  const origen = [
    p.clienteNombre.toUpperCase(),
    punto?.nombre.toUpperCase(),
    punto?.contactoNombre?.toUpperCase(),
    punto?.contactoTelefono,
  ]
    .filter(Boolean)
    .join(' - ')
  const contactoTxt = `--Nombre: ${contacto.nombre.toUpperCase()} --Telefono: ${contacto.telefono}${contacto.correo ? ` --Correo: ${contacto.correo}` : ''}`
  return `CODIGO: ${numero} TOTAL: ${total.toFixed(2)} ${origen} ${contactoTxt}`
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRol] = React.useState<Rol>('cliente')
  const [sedes, setSedes] = React.useState<Sede[]>(sedesMock)
  const [puntosEntrega, setPuntosEntrega] =
    React.useState<PuntoEntrega[]>(puntosEntregaMock)
  const [productos] = React.useState<Producto[]>(productosMock)
  const [clientes] = React.useState<Cliente[]>(clientesMock)
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

  /** Quien firma los eventos de bitácora según el rol activo de la sesión. */
  const usuarioActual = React.useCallback(
    () => (rol === 'cliente' ? clienteActualMock.email : asesorServicioMock.nombre),
    [rol],
  )

  const resolverProducto = React.useCallback(
    (id: string) => productos.find((x) => x.id === id),
    [productos],
  )

  const solicitarPedido = React.useCallback(
    (id: string) => {
      setPedidos((prev) =>
        prev.map((p): Pedido => {
          if (p.id !== id || p.estado !== 'en_construccion') return p
          // El borrador (T_xxxxxx) recibe su consecutivo definitivo.
          const numero = siguienteConsecutivo()
          const total = totalesPedido(p, resolverProducto).total
          const punto = puntosEntrega.find(
            (x) => x.id === p.despacho.puntoEntregaId,
          )
          return {
            ...p,
            estado: 'solicitado',
            numero,
            fechaSolicitud: new Date().toISOString(),
            bitacora: [
              ...p.bitacora,
              nuevoEvento(
                'documento_solicitado',
                p.creadorEmail,
                detalleDocumento(p, numero, total, punto),
              ),
            ],
          }
        }),
      )
    },
    [puntosEntrega, resolverProducto],
  )

  const crearPedido = React.useCallback(
    (pedido: Pedido, opts?: { solicitar?: boolean }) => {
      const solicitar = opts?.solicitar ?? false
      let nuevo = pedido
      if (solicitar) {
        // Misma transición que solicitarPedido: consecutivo real, fecha de
        // solicitud y evento 'documento_solicitado'. Se antepone un comentario
        // que deja constancia de que el pedido nació desde la vista SAC.
        const numero = siguienteConsecutivo()
        const total = totalesPedido(pedido, resolverProducto).total
        const punto = puntosEntrega.find(
          (x) => x.id === pedido.despacho.puntoEntregaId,
        )
        nuevo = {
          ...pedido,
          estado: 'solicitado',
          numero,
          fechaSolicitud: new Date().toISOString(),
          bitacora: [
            ...pedido.bitacora,
            nuevoEvento(
              'comentario_documento',
              usuarioActual(),
              `Pedido creado por Servicio al Cliente en nombre de ${pedido.clienteNombre}. ${detalleDocumento(pedido, numero, total, punto)}`,
            ),
            nuevoEvento(
              'documento_solicitado',
              pedido.creadorEmail,
              detalleDocumento(pedido, numero, total, punto),
            ),
          ],
        }
      }
      setPedidos((prev) => [nuevo, ...prev])
      return nuevo.id
    },
    [puntosEntrega, resolverProducto, usuarioActual],
  )

  const aprobarPedido = React.useCallback(
    (id: string) => {
      setPedidos((prev) =>
        prev.map((p): Pedido => {
          if (p.id !== id || p.estado !== 'solicitado') return p
          const total = totalesPedido(p, resolverProducto).total
          return {
            ...p,
            estado: 'aprobado',
            bitacora: [
              ...p.bitacora,
              nuevoEvento(
                'documento_aprobado',
                usuarioActual(),
                `CODIGO: ${p.numero} TOTAL: ${total.toFixed(2)}`,
              ),
            ],
          }
        }),
      )
    },
    [resolverProducto, usuarioActual],
  )

  const rechazarPedido = React.useCallback(
    (id: string, motivo: string) => {
      setPedidos((prev) =>
        prev.map((p): Pedido =>
          p.id === id && p.estado === 'solicitado'
            ? {
                ...p,
                estado: 'rechazado',
                bitacora: [
                  ...p.bitacora,
                  nuevoEvento(
                    'documento_rechazado',
                    usuarioActual(),
                    `CODIGO: ${p.numero} RECHAZADO. Motivo: ${motivo}`,
                  ),
                ],
              }
            : p,
        ),
      )
    },
    [usuarioActual],
  )

  const eliminarPedido = React.useCallback((id: string) => {
    // Acción irreversible: el pedido y su bitácora desaparecen del store. No
    // se deja rastro porque la bitácora vive dentro del propio pedido (no hay
    // log global en el prototipo).
    setPedidos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const registrarMensajePedido = React.useCallback(
    (id: string, detalle: string) => {
      setPedidos((prev) =>
        prev.map((p): Pedido =>
          p.id === id
            ? {
                ...p,
                bitacora: [
                  ...p.bitacora,
                  nuevoEvento('documento_mensaje', usuarioActual(), detalle),
                ],
              }
            : p,
        ),
      )
    },
    [usuarioActual],
  )

  const actualizarPedido = React.useCallback(
    (id: string, patch: Partial<Pedido>) => {
      // Las transiciones de estado solo ocurren vía solicitarPedido/aprobarPedido.
      const resto = { ...patch }
      delete resto.estado
      // La bitácora es append-only: nunca se reemplaza vía patch.
      delete resto.bitacora
      setPedidos((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const resumen = resumenCambios(p, resto, {
            producto: resolverProducto,
            sede: (sid) => sedes.find((s) => s.id === sid),
            punto: (pid) => puntosEntrega.find((x) => x.id === pid),
          })
          // Sin diferencias no se registra evento.
          if (!resumen) return { ...p, ...resto }
          return {
            ...p,
            ...resto,
            bitacora: [
              ...p.bitacora,
              nuevoEvento('documento_modificado', usuarioActual(), resumen),
            ],
          }
        }),
      )
    },
    [resolverProducto, sedes, puntosEntrega, usuarioActual],
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

  const getCliente = React.useCallback(
    (id: string) => clientes.find((c) => c.id === id),
    [clientes],
  )

  const value = React.useMemo(
    () => ({
      rol,
      setRol,
      sedes,
      productos,
      pedidos,
      clientes,
      getCliente,
      crearPedido,
      solicitarPedido,
      aprobarPedido,
      rechazarPedido,
      eliminarPedido,
      registrarMensajePedido,
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
      clientes,
      getCliente,
      crearPedido,
      solicitarPedido,
      aprobarPedido,
      rechazarPedido,
      eliminarPedido,
      registrarMensajePedido,
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
