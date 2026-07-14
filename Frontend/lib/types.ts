export type TipoPunto = 'obra' | 'punto_venta'

export interface Sede {
  id: string
  nombre: string
  tipo: TipoPunto
  direccion: string
  ciudad: string
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

export interface DatosEntrega {
  sedeId: string
  ordenCompra: string
  nombreRecibe: string
  celular: string
  correo: string
  necesitaEstiba: boolean
  necesitaDescarga: boolean
  observaciones: string
}

export interface DatosRetira {
  sedeId: string
  ordenCompra: string
  nombreConductor: string
  cedula: string
  placa: string
  celular: string
  necesitaEstiba: boolean
  observaciones: string
}

export interface ItemPedido {
  productoId: string
  cantidad: number
  /** Fecha de entrega individual del producto (ISO yyyy-mm-dd) */
  fechaEntrega: string | null
}

export interface Pedido {
  id: string
  tipoProducto: TipoProducto | null
  metodoDespacho: MetodoDespacho | null
  datosEntrega: DatosEntrega
  datosRetira: DatosRetira
  items: ItemPedido[]
}

export const datosEntregaVacios = (): DatosEntrega => ({
  sedeId: '',
  ordenCompra: '',
  nombreRecibe: '',
  celular: '',
  correo: '',
  necesitaEstiba: false,
  necesitaDescarga: false,
  observaciones: '',
})

export const datosRetiraVacios = (): DatosRetira => ({
  sedeId: '',
  ordenCompra: '',
  nombreConductor: '',
  cedula: '',
  placa: '',
  celular: '',
  necesitaEstiba: false,
  observaciones: '',
})
