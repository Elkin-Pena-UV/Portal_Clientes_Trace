import ExcelJS from 'exceljs'
import type {
  ItemPedido,
  MetodoDespacho,
  Pedido,
  Producto,
  Sede,
} from '@/lib/types'
import { datosEntregaVacios, datosRetiraVacios } from '@/lib/types'
import { hoyInicio } from '@/lib/order-utils'
import { toFechaISO } from '@/lib/format'
import {
  COLUMNAS,
  MAX_FILAS,
  type ErrorFila,
  type FilaCruda,
  type PedidoImportado,
  type ResultadoProcesamiento,
} from './constants'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function celdaTexto(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    const dd = String(value.getDate()).padStart(2, '0')
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}/${value.getFullYear()}`
  }
  if (typeof value === 'object') {
    // Rich text / hyperlink / formula result
    const obj = value as { text?: string; result?: unknown; richText?: { text: string }[] }
    if (obj.richText) return obj.richText.map((r) => r.text).join('')
    if (obj.text) return obj.text
    if (obj.result !== undefined) return String(obj.result)
    return ''
  }
  return String(value).trim()
}

/** Lee el archivo .xlsx y devuelve filas crudas indexadas por key de columna. */
export async function leerFilas(file: File): Promise<FilaCruda[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(await file.arrayBuffer())
  const ws = wb.getWorksheet('Pedidos') ?? wb.worksheets[0]
  if (!ws) return []

  const filas: FilaCruda[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // encabezado
    const fila: FilaCruda = { __row: String(rowNumber) }
    let vacia = true
    COLUMNAS.forEach((col, idx) => {
      const texto = celdaTexto(row.getCell(idx + 1).value)
      fila[col.key] = texto
      if (texto) vacia = false
    })
    if (!vacia) filas.push(fila)
  })
  return filas
}

const RE_CELULAR = /^\d{10}$/
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_PLACA = /^[A-Z]{3}\d{3}$/
const RE_CEDULA = /^\d{6,10}$/

function normSiNo(v: string): boolean | null {
  const s = v.trim().toUpperCase()
  if (['SÍ', 'SI', 'S', 'YES', 'X', 'TRUE', '1'].includes(s)) return true
  if (['NO', 'N', 'FALSE', '0'].includes(s)) return false
  return null
}

function normMetodo(v: string): MetodoDespacho | null {
  const s = v.trim().toLowerCase()
  if (s.startsWith('entrega')) return 'entregar'
  if (s.startsWith('retira')) return 'retira'
  return null
}

/** Convierte DD/MM/YYYY o YYYY-MM-DD a Date local; null si inválido. */
function parseFecha(v: string): Date | null {
  const s = v.trim()
  if (!s) return null
  let y: number, m: number, d: number
  const slash = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  const iso = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (slash) {
    d = Number(slash[1])
    m = Number(slash[2])
    y = Number(slash[3])
  } else if (iso) {
    y = Number(iso[1])
    m = Number(iso[2])
    d = Number(iso[3])
  } else {
    return null
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d)
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/** Distancia de Levenshtein simple para sugerencias. */
function distancia(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function sugerir(valor: string, opciones: string[]): string | null {
  const v = valor.trim().toLowerCase()
  if (!v) return null
  let mejor: string | null = null
  let mejorD = Infinity
  for (const op of opciones) {
    const d = distancia(v, op.toLowerCase())
    if (d < mejorD) {
      mejorD = d
      mejor = op
    }
  }
  // Solo sugerir si es razonablemente cercano.
  return mejor && mejorD <= Math.max(2, Math.floor(v.length / 2)) ? mejor : null
}

interface FilaValidada {
  filaNum: number
  metodo: MetodoDespacho
  sede: Sede
  ordenCompra: string
  nombreContacto: string
  celular: string
  correo: string
  cedula: string
  placa: string
  estiba: boolean
  descarga: boolean
  observaciones: string
  producto: Producto
  cantidad: number
  fechaISO: string
  multi: boolean
  agrupador: number | null
}

/**
 * Valida y agrupa las filas en pedidos.
 * - Errores críticos (severidad 'error') excluyen la fila del lote.
 * - Filas multi-producto con el mismo agrupador forman un solo pedido.
 */
export function procesarFilas(
  filas: FilaCruda[],
  productos: Producto[],
  sedes: Sede[],
): ResultadoProcesamiento {
  const errores: ErrorFila[] = []
  const validas: FilaValidada[] = []
  const hoy = hoyInicio()
  const nombresSede = sedes.map((s) => s.nombre)
  const codigos = productos.map((p) => p.codigo)

  if (filas.length > MAX_FILAS) {
    errores.push({
      fila: 0,
      columna: 'Archivo',
      mensaje: `El archivo tiene ${filas.length} filas. El máximo permitido es ${MAX_FILAS}.`,
      severidad: 'error',
    })
  }

  filas.slice(0, MAX_FILAS).forEach((fila) => {
    const filaNum = Number(fila.__row)
    const err = (columna: string, mensaje: string, severidad: 'error' | 'advertencia' = 'error') =>
      errores.push({ fila: filaNum, columna, mensaje, severidad })
    let ok = true

    const metodo = normMetodo(fila.metodoDespacho)
    if (!metodo) {
      err('Método de despacho', 'Debe ser "Entregar" o "Retira".')
      ok = false
    }

    const sede = sedes.find(
      (s) => s.nombre.trim().toLowerCase() === fila.sede.trim().toLowerCase(),
    )
    if (!sede) {
      const sug = sugerir(fila.sede, nombresSede)
      err(
        'Sede / Punto de entrega',
        fila.sede.trim()
          ? `La sede "${fila.sede}" no existe.${sug ? ` ¿Quisiste decir "${sug}"?` : ''}`
          : 'La sede es obligatoria.',
      )
      ok = false
    }

    const ordenCompra = fila.ordenCompra.trim()
    if (!ordenCompra) {
      err('Orden de compra', 'La orden de compra es obligatoria.')
      ok = false
    }

    if (!fila.nombreContacto.trim()) {
      err('Nombre destinatario / Conductor', 'Este campo es obligatorio.')
      ok = false
    }

    if (!RE_CELULAR.test(fila.celular.trim())) {
      err('Celular', 'Debe tener 10 dígitos (ej: 3101234567).')
      ok = false
    }

    let correo = ''
    let cedula = ''
    let placa = ''
    let descarga = false
    if (metodo === 'entregar') {
      correo = fila.correo.trim()
      if (!RE_EMAIL.test(correo)) {
        err('Correo electrónico', 'Correo obligatorio y con formato válido para "Entregar".')
        ok = false
      }
      const dsc = normSiNo(fila.descarga)
      if (dsc === null) {
        err('¿Necesita descarga?', 'Obligatorio para "Entregar". Usa SÍ o NO.')
        ok = false
      } else {
        descarga = dsc
      }
    } else if (metodo === 'retira') {
      cedula = fila.cedula.trim()
      placa = fila.placa.trim().toUpperCase()
      if (!RE_CEDULA.test(cedula)) {
        err('CC/Cédula Conductor', 'Cédula obligatoria (6 a 10 dígitos) para "Retira".')
        ok = false
      }
      if (!RE_PLACA.test(placa)) {
        err('Placa vehículo', 'Placa obligatoria con formato ABC123 para "Retira".')
        ok = false
      }
    }

    const estiba = normSiNo(fila.estiba)
    if (estiba === null) {
      err('¿Necesita estiba?', 'Obligatorio. Usa SÍ o NO.')
      ok = false
    }

    const producto = productos.find(
      (p) => p.codigo.trim().toLowerCase() === fila.codigoProducto.trim().toLowerCase(),
    )
    if (!producto) {
      const sug = sugerir(fila.codigoProducto, codigos)
      err(
        'Código de producto',
        fila.codigoProducto.trim()
          ? `El código "${fila.codigoProducto}" no existe en el catálogo.${sug ? ` ¿Quisiste decir "${sug}"?` : ''}`
          : 'El código de producto es obligatorio.',
      )
      ok = false
    }

    const cantidad = Number(fila.cantidad.replace(/[^\d.-]/g, ''))
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      err('Cantidad', 'Debe ser un número mayor que 0.')
      ok = false
    }

    const fecha = parseFecha(fila.fechaEntrega)
    let fechaISO = ''
    if (!fecha) {
      err('Fecha de entrega', 'Fecha inválida. Usa el formato DD/MM/YYYY.')
      ok = false
    } else if (fecha < hoy) {
      err('Fecha de entrega', 'La fecha no puede ser anterior a hoy.')
      ok = false
    } else {
      fechaISO = toFechaISO(fecha)
    }

    const multi = normSiNo(fila.multiProducto)
    if (multi === null) {
      err('¿Es pedido multi-producto?', 'Obligatorio. Usa SÍ o NO.')
      ok = false
    }

    let agrupador: number | null = null
    if (multi === true) {
      const ag = Number(fila.agrupador.trim())
      if (!fila.agrupador.trim() || !Number.isFinite(ag)) {
        err('Agrupador de pedido', 'Obligatorio cuando es multi-producto. Usa un número.')
        ok = false
      } else {
        agrupador = ag
      }
    }

    if (ok && metodo && sede && producto && estiba !== null && multi !== null) {
      validas.push({
        filaNum,
        metodo,
        sede,
        ordenCompra,
        nombreContacto: fila.nombreContacto.trim(),
        celular: fila.celular.trim(),
        correo,
        cedula,
        placa,
        estiba,
        descarga,
        observaciones: fila.observaciones.trim(),
        producto,
        cantidad,
        fechaISO,
        multi,
        agrupador,
      })
    }
  })

  // Agrupar filas válidas en pedidos.
  const grupos = new Map<string, FilaValidada[]>()
  validas.forEach((f) => {
    const key = f.multi && f.agrupador !== null ? `g:${f.agrupador}` : `f:${f.filaNum}`
    const arr = grupos.get(key) ?? []
    arr.push(f)
    grupos.set(key, arr)
  })

  const pedidos: PedidoImportado[] = []
  grupos.forEach((rows, key) => {
    const base = rows[0]
    const items: ItemPedido[] = rows.map((r) => ({
      productoId: r.producto.id,
      cantidad: r.cantidad,
      fechaEntrega: r.fechaISO,
    }))
    const pedido: Pedido = {
      id: uid(),
      tipoProducto: base.producto.tipo,
      metodoDespacho: base.metodo,
      datosEntrega:
        base.metodo === 'entregar'
          ? {
              sedeId: base.sede.id,
              ordenCompra: base.ordenCompra,
              nombreRecibe: base.nombreContacto,
              celular: base.celular,
              correo: base.correo,
              necesitaEstiba: base.estiba,
              necesitaDescarga: base.descarga,
              observaciones: base.observaciones,
            }
          : datosEntregaVacios(),
      datosRetira:
        base.metodo === 'retira'
          ? {
              sedeId: base.sede.id,
              ordenCompra: base.ordenCompra,
              nombreConductor: base.nombreContacto,
              cedula: base.cedula,
              placa: base.placa,
              celular: base.celular,
              necesitaEstiba: base.estiba,
              observaciones: base.observaciones,
            }
          : datosRetiraVacios(),
      items,
    }
    const filasNums = rows.map((r) => r.filaNum).sort((a, b) => a - b)
    const origen = key.startsWith('g:')
      ? `Agrupador ${key.slice(2)} (filas ${filasNums.join(', ')})`
      : `Fila ${filasNums[0]}`
    pedidos.push({
      pedido,
      origen,
      agrupador: key.startsWith('g:') ? Number(key.slice(2)) : null,
    })
  })

  // Ordenar: pedidos agrupados primero por número, luego por fila.
  pedidos.sort((a, b) => {
    const fa = Number(a.origen.match(/\d+/)?.[0] ?? 0)
    const fb = Number(b.origen.match(/\d+/)?.[0] ?? 0)
    return fa - fb
  })

  return {
    pedidos,
    errores,
    totalFilas: filas.length,
    filasValidas: validas.length,
  }
}

/** Genera un reporte CSV de errores para descargar. */
export function generarReporteErrores(errores: ErrorFila[]): Blob {
  const head = 'Fila,Columna,Severidad,Mensaje'
  const lines = errores.map((e) => {
    const msg = `"${e.mensaje.replace(/"/g, '""')}"`
    return `${e.fila || ''},"${e.columna}",${e.severidad},${msg}`
  })
  const csv = [head, ...lines].join('\n')
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
}
