import ExcelJS from 'exceljs'
import type { Producto, PuntoEntrega, Sede } from '@/lib/types'
import {
  COLOR_AZUL,
  COLOR_BLANCO,
  COLOR_NARANJA,
  COLUMNAS,
} from './constants'

/** Fecha de ejemplo: hoy + n días, formateada DD/MM/YYYY. */
function fechaEjemplo(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/**
 * Genera el archivo Excel de plantilla y devuelve un Blob listo para descargar.
 * Incluye:
 *  - Hoja "Pedidos" con encabezados de colores, validaciones (desplegables) y 5 filas de ejemplo.
 *  - Hoja "Instrucciones" con la guía de llenado y ejemplos.
 *  - Hoja oculta "Listas" con catálogos para los desplegables.
 */
export async function generarPlantilla(
  productos: Producto[],
  sedes: Sede[],
  puntosEntrega: PuntoEntrega[],
): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CementoYa'
  wb.created = new Date()

  // --- Hoja oculta de listas (para validaciones de datos) ---
  const listas = wb.addWorksheet('Listas', { state: 'veryHidden' })
  const codigos = productos.map((p) => p.codigo)
  const nombresSede = sedes.filter((s) => s.activa).map((s) => s.nombre)
  const nombresPunto = puntosEntrega.map((p) => p.nombre)

  // Escribir cada lista en su columna comenzando en la fila 1 (sin ambigüedad).
  listas.getCell('A1').value = 'Entregar'
  listas.getCell('A2').value = 'Retira'
  listas.getCell('B1').value = 'SÍ'
  listas.getCell('B2').value = 'NO'
  codigos.forEach((c, i) => {
    listas.getCell(`C${i + 1}`).value = c
  })
  nombresSede.forEach((n, i) => {
    listas.getCell(`D${i + 1}`).value = n
  })
  nombresPunto.forEach((n, i) => {
    listas.getCell(`E${i + 1}`).value = n
  })

  const rangoDespacho = '=Listas!$A$1:$A$2'
  const rangoSiNo = '=Listas!$B$1:$B$2'
  const rangoCodigos = `=Listas!$C$1:$C$${Math.max(codigos.length, 1)}`
  const rangoSedes = `=Listas!$D$1:$D$${Math.max(nombresSede.length, 1)}`
  const rangoPuntos = `=Listas!$E$1:$E$${Math.max(nombresPunto.length, 1)}`

  // --- Hoja Pedidos ---
  const ws = wb.addWorksheet('Pedidos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = COLUMNAS.map((c) => ({ key: c.key, width: c.width }))

  // Encabezados con estilo corporativo.
  const headerRow = ws.getRow(1)
  COLUMNAS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header
    cell.font = { bold: true, color: { argb: COLOR_BLANCO }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.critica ? COLOR_NARANJA : COLOR_AZUL },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })
  headerRow.height = 32

  const getProd = (codigo: string) => productos.find((p) => p.codigo === codigo)
  // Sede (nombre) a la que pertenece un punto, para ejemplos coherentes.
  const sedeDe = (punto?: PuntoEntrega) =>
    sedes.find((s) => s.id === punto?.sedeDespachoId)?.nombre ?? ''

  // Filas de ejemplo (5 filas -> 4 pedidos; las filas 4 y 5 se agrupan).
  const ejemplos: Record<string, string>[] = [
    {
      metodoDespacho: 'Entregar',
      sede: sedeDe(puntosEntrega[0]) || 'Cali – Planta SC',
      puntoEntrega: puntosEntrega[0]?.nombre ?? 'Obra Torre Central',
      ordenCompra: '254701',
      nombreContacto: 'Marcela Ríos',
      celular: '3104567890',
      correo: 'marcela@obra.com',
      cedula: '',
      placa: '',
      estiba: 'SÍ',
      descarga: 'SÍ',
      observaciones: 'Entregar en horario de la mañana',
      codigoProducto: 'COD-0042',
      cantidad: '100',
      fechaEntrega: fechaEjemplo(7),
      multiProducto: 'NO',
      agrupador: '',
    },
    {
      metodoDespacho: 'Retira',
      sede: sedeDe(puntosEntrega[1]) || 'Cali – Planta SC',
      puntoEntrega: puntosEntrega[1]?.nombre ?? 'Punto de Venta Norte',
      ordenCompra: '254702',
      nombreContacto: 'Juan Conductor',
      celular: '3201112233',
      correo: '',
      cedula: '1098765432',
      placa: 'ABC123',
      estiba: 'NO',
      descarga: '',
      observaciones: 'Llamar antes de llegar',
      codigoProducto: 'COD-0110',
      cantidad: '5',
      fechaEntrega: fechaEjemplo(5),
      multiProducto: 'NO',
      agrupador: '',
    },
    {
      metodoDespacho: 'Entregar',
      sede: sedeDe(puntosEntrega[2]) || 'Yumbo – San Marcos',
      puntoEntrega: puntosEntrega[2]?.nombre ?? 'Obra Conjunto Las Palmas',
      ordenCompra: '254703',
      nombreContacto: 'Julián Vélez',
      celular: '3009876543',
      correo: 'julian@palmas.com',
      cedula: '',
      placa: '',
      estiba: 'SÍ',
      descarga: 'NO',
      observaciones: '',
      codigoProducto: 'COD-0051',
      cantidad: '50',
      fechaEntrega: fechaEjemplo(10),
      multiProducto: 'SÍ',
      agrupador: '1',
    },
    {
      metodoDespacho: 'Entregar',
      sede: sedeDe(puntosEntrega[2]) || 'Yumbo – San Marcos',
      puntoEntrega: puntosEntrega[2]?.nombre ?? 'Obra Conjunto Las Palmas',
      ordenCompra: '254703',
      nombreContacto: 'Julián Vélez',
      celular: '3009876543',
      correo: 'julian@palmas.com',
      cedula: '',
      placa: '',
      estiba: 'SÍ',
      descarga: 'NO',
      observaciones: '',
      codigoProducto: 'COD-0067',
      cantidad: '30',
      fechaEntrega: fechaEjemplo(10),
      multiProducto: 'SÍ',
      agrupador: '1',
    },
    {
      metodoDespacho: 'Retira',
      sede: sedeDe(puntosEntrega[3]) || 'Palmira – Zona Franca',
      puntoEntrega: puntosEntrega[3]?.nombre ?? 'Punto de Venta Sur',
      ordenCompra: '254704',
      nombreContacto: 'Andrea Conductor',
      celular: '3157654321',
      correo: '',
      cedula: '1054321098',
      placa: 'XYZ789',
      estiba: 'NO',
      descarga: '',
      observaciones: '',
      codigoProducto: 'COD-0043',
      cantidad: '20',
      fechaEntrega: fechaEjemplo(8),
      multiProducto: 'NO',
      agrupador: '',
    },
  ]

  ejemplos.forEach((ej) => {
    ej.nombreProducto = getProd(ej.codigoProducto)?.nombre ?? ''
    ws.addRow(ej)
  })

  // Letra de columna por key (independiente del orden, para no romper al
  // agregar/mover columnas en COLUMNAS).
  const colLetra = (key: string) => {
    const idx = COLUMNAS.findIndex((c) => c.key === key)
    return ws.getColumn(idx + 1).letter
  }
  const L = {
    metodo: colLetra('metodoDespacho'),
    sede: colLetra('sede'),
    puntoEntrega: colLetra('puntoEntrega'),
    estiba: colLetra('estiba'),
    descarga: colLetra('descarga'),
    codigo: colLetra('codigoProducto'),
    cantidad: colLetra('cantidad'),
    multi: colLetra('multiProducto'),
  }

  // Validaciones de datos para las filas de datos (encabezado + ejemplos + filas extra).
  const ultimaFila = 200
  for (let r = 2; r <= ultimaFila; r++) {
    ws.getCell(`${L.metodo}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoDespacho],
    }
    ws.getCell(`${L.sede}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoSedes],
    }
    ws.getCell(`${L.puntoEntrega}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoPuntos],
    }
    ws.getCell(`${L.estiba}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoSiNo],
    }
    ws.getCell(`${L.descarga}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoSiNo],
    }
    ws.getCell(`${L.codigo}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoCodigos],
    }
    ws.getCell(`${L.multi}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [rangoSiNo],
    }
    ws.getCell(`${L.cantidad}${r}`).dataValidation = {
      type: 'whole',
      operator: 'greaterThan',
      allowBlank: true,
      formulae: [0],
    }
  }

  // --- Hoja Instrucciones ---
  const ins = wb.addWorksheet('Instrucciones')
  ins.getColumn(1).width = 4
  ins.getColumn(2).width = 34
  ins.getColumn(3).width = 70
  ins.getColumn(4).width = 30

  const titulo = ins.getRow(2)
  titulo.getCell(2).value = 'INSTRUCCIONES PARA LLENAR LA PLANTILLA'
  titulo.getCell(2).font = { bold: true, size: 14, color: { argb: COLOR_AZUL } }
  ins.mergeCells('B2:D2')

  const subt = ins.getRow(3)
  subt.getCell(2).value =
    'Completa la hoja "Pedidos". Reemplaza las filas de ejemplo con tus datos. La fecha no puede ser anterior a hoy.'
  subt.getCell(2).font = { italic: true, color: { argb: 'FF555555' } }
  ins.mergeCells('B3:D3')

  // Encabezado de la tabla de ayuda.
  const headIns = ins.getRow(5)
  ;['#', 'Columna', 'Descripción / Formato', 'Ejemplo'].forEach((t, i) => {
    const cell = headIns.getCell(i + 1)
    cell.value = t
    cell.font = { bold: true, color: { argb: COLOR_BLANCO } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_AZUL },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })

  COLUMNAS.forEach((col, idx) => {
    const row = ins.getRow(6 + idx)
    row.getCell(1).value = idx + 1
    row.getCell(2).value = col.header
    row.getCell(2).font = { bold: true, color: { argb: col.critica ? COLOR_NARANJA : COLOR_AZUL } }
    row.getCell(3).value = col.ayuda
    row.getCell(3).alignment = { wrapText: true, vertical: 'top' }
    row.getCell(4).value = col.ejemplo
    row.getCell(4).alignment = { vertical: 'top' }
  })

  const notaRow = 6 + COLUMNAS.length + 1
  ins.getRow(notaRow).getCell(2).value = 'Notas importantes:'
  ins.getRow(notaRow).getCell(2).font = { bold: true }
  const notas = [
    'La Sede es la planta de despacho y determina qué Puntos de entrega son válidos: el punto indicado debe pertenecer a la sede de su misma fila, o la fila se marcará con error.',
    'La fecha de entrega no puede ser anterior a hoy.',
    'Para pedidos con varios productos, marca "¿Es multi-producto?" = SÍ y usa el mismo número en "Agrupador de pedido".',
    'Si el método es Entregar: el correo es obligatorio. Si es Retira: la cédula y placa del conductor son obligatorias.',
    'Máximo 100 filas por archivo. Tamaño máximo 10 MB.',
    'Soporte: soporte@cementoya.com',
  ]
  notas.forEach((n, i) => {
    const row = ins.getRow(notaRow + 1 + i)
    row.getCell(2).value = '•'
    row.getCell(3).value = n
    row.getCell(3).alignment = { wrapText: true }
  })

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Dispara la descarga del Blob con el nombre indicado. */
export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
