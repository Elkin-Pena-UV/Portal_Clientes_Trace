import type { Pedido } from '@/lib/types'

/** Colores corporativos para encabezados del Excel (ARGB sin #). */
export const COLOR_AZUL = 'FF00359A'
export const COLOR_NARANJA = 'FFFF6600'
export const COLOR_BLANCO = 'FFFFFFFF'

export type Severidad = 'error' | 'advertencia'

/** Definición de una columna de la hoja "Pedidos". */
export interface ColumnaDef {
  /** Clave interna usada al parsear cada fila. */
  key: string
  /** Encabezado mostrado en el Excel. */
  header: string
  /** Ancho de columna en el Excel. */
  width: number
  /** Si es una columna crítica (encabezado naranja) o principal (azul). */
  critica?: boolean
  /** Texto de ayuda para la hoja de instrucciones. */
  ayuda: string
  /** Ejemplo para la hoja de instrucciones. */
  ejemplo: string
}

/**
 * Columnas de la hoja "Pedidos" EN ORDEN. No cambiar el orden: el parser
 * depende de la posición de cada columna.
 */
export const COLUMNAS: ColumnaDef[] = [
  {
    key: 'metodoDespacho',
    header: 'Método de despacho',
    width: 20,
    critica: true,
    ayuda: 'Obligatorio. Define si la empresa entrega o el cliente retira. Valores: Entregar / Retira.',
    ejemplo: 'Entregar',
  },
  {
    key: 'sede',
    header: 'Sede',
    width: 22,
    ayuda:
      'Obligatorio. Nombre exacto de una sede de despacho del catálogo de Sedes. Determina qué puntos de entrega son válidos en esa fila.',
    ejemplo: 'Cali – Planta SC',
  },
  {
    key: 'puntoEntrega',
    header: 'Punto de entrega',
    width: 26,
    ayuda:
      'Obligatorio. Nombre exacto de un punto de entrega del catálogo. Debe pertenecer a la Sede indicada en la columna anterior.',
    ejemplo: 'Obra Torre Central',
  },
  {
    key: 'ordenCompra',
    header: 'Orden de compra',
    width: 18,
    critica: true,
    ayuda: 'Obligatorio para ambos métodos (Entregar y Retira). Número o código de la orden de compra.',
    ejemplo: '254701',
  },
  {
    key: 'nombreContacto',
    header: 'Nombre destinatario / Conductor',
    width: 28,
    ayuda: 'Obligatorio. Si es Entregar: quien recibe. Si es Retira: nombre del conductor.',
    ejemplo: 'Marcela Ríos',
  },
  {
    key: 'celular',
    header: 'Celular',
    width: 14,
    critica: true,
    ayuda: 'Obligatorio. 10 dígitos colombianos. Ejemplo: 3101234567.',
    ejemplo: '3101234567',
  },
  {
    key: 'correo',
    header: 'Correo electrónico',
    width: 26,
    ayuda: 'Obligatorio solo si el método es Entregar. Debe tener formato de email válido.',
    ejemplo: 'marcela@obra.com',
  },
  {
    key: 'cedula',
    header: 'CC/Cédula Conductor',
    width: 18,
    ayuda: 'Obligatorio solo si el método es Retira. Número de identificación del conductor.',
    ejemplo: '1098765432',
  },
  {
    key: 'placa',
    header: 'Placa vehículo',
    width: 14,
    ayuda: 'Obligatorio solo si el método es Retira. Formato colombiano: ABC123.',
    ejemplo: 'ABC123',
  },
  {
    key: 'estiba',
    header: '¿Necesita estiba?',
    width: 16,
    ayuda: 'Obligatorio. Valores: SÍ / NO.',
    ejemplo: 'SÍ',
  },
  {
    key: 'descarga',
    header: '¿Necesita descarga?',
    width: 18,
    ayuda: 'Obligatorio solo si el método es Entregar. Valores: SÍ / NO.',
    ejemplo: 'SÍ',
  },
  {
    key: 'observaciones',
    header: 'Observaciones',
    width: 30,
    ayuda: 'Opcional. Notas adicionales para la entrega o el retiro.',
    ejemplo: 'Llamar antes de llegar',
  },
  {
    key: 'codigoProducto',
    header: 'Código de producto',
    width: 18,
    critica: true,
    ayuda: 'Obligatorio. Código del catálogo. Ejemplo: COD-0042.',
    ejemplo: 'COD-0042',
  },
  {
    key: 'nombreProducto',
    header: 'Nombre de producto',
    width: 28,
    ayuda: 'Se autocompleta según el código. Puedes escribir parte del nombre como referencia.',
    ejemplo: 'Cemento Gris Estructural',
  },
  {
    key: 'cantidad',
    header: 'Cantidad',
    width: 12,
    critica: true,
    ayuda: 'Obligatorio. Número mayor que 0.',
    ejemplo: '100',
  },
  {
    key: 'fechaEntrega',
    header: 'Fecha de entrega (DD/MM/YYYY)',
    width: 24,
    critica: true,
    ayuda: 'Obligatorio. Formato DD/MM/YYYY. No puede ser anterior a hoy.',
    ejemplo: '30/06/2026',
  },
  {
    key: 'multiProducto',
    header: '¿Es pedido multi-producto?',
    width: 24,
    ayuda: 'Obligatorio. SÍ agrupa este producto con otros bajo un mismo pedido. Valores: SÍ / NO.',
    ejemplo: 'NO',
  },
  {
    key: 'agrupador',
    header: 'Agrupador de pedido',
    width: 20,
    ayuda: 'Obligatorio si multi-producto = SÍ. Productos con el mismo número forman un único pedido.',
    ejemplo: '1',
  },
]

export const MAX_FILAS = 100
export const MAX_TAMANO_MB = 10

/** Una fila cruda leída del Excel, indexada por key de columna. */
export type FilaCruda = Record<string, string>

/** Error de validación asociado a una fila. */
export interface ErrorFila {
  /** Número de fila en el Excel (1-based, incluyendo encabezado). */
  fila: number
  columna: string
  mensaje: string
  severidad: Severidad
}

/** Resultado de procesar el archivo completo. */
export interface ResultadoProcesamiento {
  pedidos: PedidoImportado[]
  errores: ErrorFila[]
  totalFilas: number
  filasValidas: number
}

/** Pedido construido a partir de la plantilla, con metadatos de importación. */
export interface PedidoImportado {
  pedido: Pedido
  /** Etiqueta de origen, ej: "Fila 2" o "Agrupador 1 (filas 4-5)". */
  origen: string
  /** Número de agrupador si aplica. */
  agrupador: number | null
}
