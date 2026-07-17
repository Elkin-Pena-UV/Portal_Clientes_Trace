export type TipoPunto = 'obra' | 'punto_venta'

/**
 * Sucursal/planta de despacho de Cementos San Marcos (ej: "Cali – Planta SC").
 * Catálogo pequeño y fijo, gestionado por la compañía.
 */
export interface Sede {
  id: string
  nombre: string
  ciudad: string
  direccion: string
  activa: boolean
}

/**
 * Ubicación del cliente donde se recibe/retira el pedido (obra o punto de
 * venta). Cada punto pertenece a una única Sede de despacho.
 */
export interface PuntoEntrega {
  id: string
  nombre: string
  tipo: TipoPunto
  direccion: string
  ciudad: string
  /** Sede (planta) desde la que se despacha todo lo pedido hacia este punto. */
  sedeDespachoId: string
  contactoNombre?: string
  contactoTelefono?: string
}

export type TipoProducto = 'saco' | 'granel'

/** Categoría de catálogo. Solo se subdivide visualmente para productos en saco. */
export type CategoriaProducto = 'cemento' | 'linea_acabados'

export interface Producto {
  id: string
  codigo: string
  nombre: string
  marca: string
  tipo: TipoProducto
  /** Categoría para agrupar en el catálogo (aplica principalmente a "saco"). */
  categoria: CategoriaProducto
  presentacion: string
  /** Unidad de medida, ej: "Bulto 50kg", "Ton", "m³" */
  unidad: string
  precio: number
  /** Porcentaje de IVA en decimal, ej: 0.19 */
  iva: number
  imagen: string
}

export type MetodoDespacho = 'entregar' | 'retira'

/**
 * Datos comunes a cualquier método de despacho. Al alternar Entregar/Retira
 * este bloque NO se reinicia: solo cambia el bloque de contacto.
 */
export interface DatosDespacho {
  /** Sede (planta) que despacha, paso 1 de la cascada. */
  sedeId: string
  /** Punto de entrega (Entregar) o de retiro (Retira); pertenece a la sede. */
  puntoEntregaId: string
  ordenCompra: string
  necesitaEstiba: boolean
  /** Solo aplica a 'entregar'; en 'retira' siempre false. */
  necesitaDescarga: boolean
  observaciones: string
}

/** Contacto cuando el método es 'entregar'. */
export interface ContactoEntrega {
  nombreRecibe: string
  celular: string
  correo: string
}

/** Contacto cuando el método es 'retira'. */
export interface ContactoRetira {
  nombreConductor: string
  cedula: string
  placa: string
  celular: string
}

export interface ItemPedido {
  productoId: string
  cantidad: number
  /** Fecha de entrega individual del producto (ISO yyyy-mm-dd) */
  fechaEntrega: string | null
}

/**
 * Ciclo de vida de un pedido. Extensible: los estados posteriores
 * (despacho, entrega, etc.) se agregan aquí cuando existan sus vistas.
 */
export type EstadoPedido =
  | 'en_construccion'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  en_construccion: 'En construcción',
  solicitado: 'Solicitado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

export type Rol = 'cliente' | 'servicio' | 'admin'

/**
 * TODO(negocio): SUPOSICIÓN A CONFIRMAR. En la pantalla real de Ventas hay dos
 * columnas "Estado": el badge de color (ciclo de vida = `estado`) y un texto
 * "Aprobado"/"Sin Aprobar" que NO siempre coincide con el badge (fila 269554:
 * texto "Sin Aprobar", badge "Aprobado"). Se modela como un estado de
 * aprobación de crédito independiente hasta confirmar su semántica.
 */
export type EstadoCredito = 'aprobado' | 'sin_aprobar'

export const ESTADO_CREDITO_LABEL: Record<EstadoCredito, string> = {
  aprobado: 'Aprobado',
  sin_aprobar: 'Sin Aprobar',
}

export interface Pedido {
  id: string
  /** Número visible ("Cod"): con prefijo T_ mientras es borrador, consecutivo limpio al solicitar. */
  numero: string
  estado: EstadoPedido
  /** Número de exportación ("Exportado"/PVC); null hasta aprobar/exportar. */
  pvc: string | null
  /** Estado de aprobación de crédito (ver TODO en EstadoCredito). */
  estadoCredito: EstadoCredito
  /** Forma de pago, ej: "Crédito". */
  formaPago: string
  /** Plazo del crédito, ej: "Crédito 30 días". */
  plazoCredito: string
  clienteId: string
  clienteNombre: string
  /** Fecha de creación en ISO 8601 */
  fechaCreacion: string
  /** Fecha en que se solicitó (transición a 'solicitado'), ISO 8601; null en borradores. */
  fechaSolicitud: string | null
  /** Email del usuario que creó el pedido. */
  creadorEmail: string
  /** Moneda del pedido, ej: 'COP'. */
  moneda: string
  tipoProducto: TipoProducto | null
  metodoDespacho: MetodoDespacho | null
  /** Bloque común de despacho: se conserva al alternar el método. */
  despacho: DatosDespacho
  /**
   * Ambos contactos coexisten siempre: al cambiar de método NO se limpia el
   * otro, solo se deja de mostrar. Si el usuario vuelve, sus datos siguen ahí.
   */
  contactoEntrega: ContactoEntrega
  contactoRetira: ContactoRetira
  items: ItemPedido[]
  /**
   * Sede que emite la factura del pedido (puede diferir de la sede que
   * despacha). La asigna SAC desde el detalle de Gestión: NO viene del pedido
   * del cliente ni debe aparecer en los formularios del portal del cliente.
   * null = "Sin asignar".
   */
  sedeFacturaId: string | null
}

export const despachoVacio = (): DatosDespacho => ({
  sedeId: '',
  puntoEntregaId: '',
  ordenCompra: '',
  necesitaEstiba: false,
  necesitaDescarga: false,
  observaciones: '',
})

export const contactoEntregaVacio = (): ContactoEntrega => ({
  nombreRecibe: '',
  celular: '',
  correo: '',
})

export const contactoRetiraVacio = (): ContactoRetira => ({
  nombreConductor: '',
  cedula: '',
  placa: '',
  celular: '',
})
