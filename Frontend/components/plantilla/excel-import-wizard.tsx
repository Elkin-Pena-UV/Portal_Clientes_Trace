'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  PackageCheck,
  ArrowRight,
} from 'lucide-react'
import type { PedidoImportado, ResultadoProcesamiento } from '@/lib/plantilla/constants'
import { generarPlantilla, descargarBlob } from '@/lib/plantilla/template'
import { leerFilas, procesarFilas } from '@/lib/plantilla/process'
import { totalesPedido, totalesGlobales, totalUnidades } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import { usePortal } from '@/components/portal-provider'
import { FileDropzone } from '@/components/plantilla/file-dropzone'
import { ValidationErrors } from '@/components/plantilla/validation-errors'
import { PedidosReview } from '@/components/plantilla/pedidos-review'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type Paso = 'inicio' | 'procesando' | 'revision' | 'confirmado'

interface PedidoConfirmado {
  numero: string
  productos: number
  unidades: number
  total: number
}

const PASOS = [
  { id: 'descargar', label: 'Descargar' },
  { id: 'cargar', label: 'Cargar' },
  { id: 'revisar', label: 'Revisar' },
  { id: 'confirmar', label: 'Confirmar' },
] as const

export function ExcelImportWizard() {
  const router = useRouter()
  const { productos, sedes, puntosEntrega, getProducto, setBorradorImportado } =
    usePortal()
  const [paso, setPaso] = React.useState<Paso>('inicio')
  const [generando, setGenerando] = React.useState(false)
  const [resultado, setResultado] = React.useState<ResultadoProcesamiento | null>(null)
  const [pedidos, setPedidos] = React.useState<PedidoImportado[]>([])
  const [confirmando, setConfirmando] = React.useState(false)
  const [confirmados, setConfirmados] = React.useState<PedidoConfirmado[]>([])

  const pasoActivo =
    paso === 'inicio'
      ? 1
      : paso === 'procesando'
        ? 2
        : paso === 'revision'
          ? 3
          : 4

  async function descargarPlantilla() {
    setGenerando(true)
    try {
      const blob = await generarPlantilla(productos, sedes, puntosEntrega)
      descargarBlob(blob, 'CementoYa_Plantilla_Pedidos.xlsx')
      toast.success('Plantilla descargada. Complétala y vuelve a subirla.')
    } catch {
      toast.error('No se pudo generar la plantilla.')
    } finally {
      setGenerando(false)
    }
  }

  async function procesarArchivo(file: File) {
    setPaso('procesando')
    try {
      const filas = await leerFilas(file)
      if (filas.length === 0) {
        toast.error('El archivo no contiene filas de pedidos.')
        setPaso('inicio')
        return
      }
      // Pequeña espera para mostrar el estado de carga.
      await new Promise((r) => setTimeout(r, 600))
      const res = procesarFilas(filas, productos, sedes, puntosEntrega)
      setResultado(res)
      setPedidos(res.pedidos)
      setPaso('revision')
      if (res.pedidos.length === 0) {
        toast.error('No se pudo construir ningún pedido válido.')
      } else {
        toast.success(
          `${res.pedidos.length} ${
            res.pedidos.length === 1 ? 'pedido procesado' : 'pedidos procesados'
          } correctamente.`,
        )
      }
    } catch {
      toast.error('No se pudo leer el archivo. Verifica que sea un .xlsx válido.')
      setPaso('inicio')
    }
  }

  function eliminarPedido(id: string) {
    setPedidos((prev) => prev.filter((p) => p.pedido.id !== id))
    toast.info('Pedido eliminado del lote.')
  }

  function editarEnPortal() {
    setBorradorImportado(pedidos.map((p) => p.pedido))
    router.push('/')
  }

  function confirmar() {
    if (pedidos.length === 0) return
    setConfirmando(true)
    setTimeout(() => {
      const resumen: PedidoConfirmado[] = pedidos.map((p, i) => ({
        numero: `PED-${String(i + 1).padStart(4, '0')}`,
        productos: p.pedido.items.length,
        unidades: totalUnidades(p.pedido),
        total: totalesPedido(p.pedido, getProducto).total,
      }))
      setConfirmados(resumen)
      setConfirmando(false)
      setPaso('confirmado')
      toast.success('¡Pedidos creados correctamente!')
    }, 1200)
  }

  function descargarConfirmacion() {
    const head = 'Numero de pedido,Productos,Unidades,Total'
    const lines = confirmados.map(
      (c) => `${c.numero},${c.productos},${c.unidades},${c.total}`,
    )
    const csv = ['\uFEFF' + head, ...lines].join('\n')
    descargarBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      'CementoYa_Confirmacion_Pedidos.csv',
    )
  }

  function reiniciar() {
    setResultado(null)
    setPedidos([])
    setConfirmados([])
    setPaso('inicio')
  }

  const totalGeneral = totalesGlobales(
    pedidos.map((p) => p.pedido),
    getProducto,
  )

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Cargar plantilla Excel
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Descarga la plantilla, llénala con tus pedidos y súbela. El sistema la
          valida y te muestra un resumen antes de confirmar.
        </p>
      </div>

      {/* Indicador de pasos */}
      <ol className="mt-6 flex items-center gap-2">
        {PASOS.map((p, i) => {
          const num = i + 1
          const estado =
            num < pasoActivo ? 'done' : num === pasoActivo ? 'current' : 'pending'
          return (
            <li key={p.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  estado === 'done' && 'bg-brand text-brand-foreground',
                  estado === 'current' && 'bg-primary text-primary-foreground',
                  estado === 'pending' && 'bg-muted text-muted-foreground',
                )}
              >
                {estado === 'done' ? <CheckCircle2 className="size-4" /> : num}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:inline',
                  estado === 'pending' && 'text-muted-foreground',
                )}
              >
                {p.label}
              </span>
              {i < PASOS.length - 1 && (
                <span className="h-px flex-1 bg-border" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-6">
        {(paso === 'inicio' || paso === 'procesando') && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Paso 1: Descargar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  1. Descargar plantilla
                </CardTitle>
                <CardDescription>
                  Incluye hojas de Pedidos e Instrucciones, listas desplegables y
                  filas de ejemplo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={descargarPlantilla} disabled={generando}>
                  {generando ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Download data-icon="inline-start" />
                  )}
                  Descargar plantilla Excel
                </Button>
              </CardContent>
            </Card>

            {/* Paso 2: Cargar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <ListChecks className="size-4" />
                  </span>
                  2. Cargar plantilla
                </CardTitle>
                <CardDescription>
                  Sube el archivo .xlsx completado para validarlo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paso === 'procesando' ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12">
                    <Spinner className="size-7 text-brand" />
                    <p className="text-sm font-medium">Procesando plantilla...</p>
                  </div>
                ) : (
                  <FileDropzone onFile={procesarArchivo} />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {paso === 'revision' && resultado && (
          <div className="flex flex-col gap-4 pb-28">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <PackageCheck className="size-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {pedidos.length}{' '}
                  {pedidos.length === 1 ? 'pedido listo' : 'pedidos listos'} para
                  confirmar
                </span>
                <span className="text-xs text-muted-foreground">
                  {resultado.totalFilas} filas leídas · {resultado.filasValidas}{' '}
                  válidas · {resultado.errores.length} incidencias
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reiniciar}
                className="ml-auto"
              >
                <RefreshCw data-icon="inline-start" />
                Cargar otra plantilla
              </Button>
            </div>

            <ValidationErrors errores={resultado.errores} />

            {pedidos.length > 0 ? (
              <PedidosReview
                pedidos={pedidos}
                onEditar={editarEnPortal}
                onEliminar={eliminarPedido}
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No hay pedidos válidos. Corrige el Excel y vuelve a subirlo.
                </CardContent>
              </Card>
            )}

            {/* Barra de confirmación sticky */}
            {pedidos.length > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 py-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Total general · {pedidos.length}{' '}
                      {pedidos.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatCOP(totalGeneral.total)}
                    </span>
                  </div>
                  <Button
                    onClick={confirmar}
                    disabled={confirmando}
                    className="ml-auto"
                  >
                    {confirmando && (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    )}
                    {confirmando
                      ? 'Creando pedidos...'
                      : `Confirmar ${pedidos.length} ${
                          pedidos.length === 1 ? 'pedido' : 'pedidos'
                        }`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {paso === 'confirmado' && (
          <Card>
            <CardContent className="flex flex-col gap-6 py-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="size-9" />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">
                    Se crearon {confirmados.length}{' '}
                    {confirmados.length === 1 ? 'pedido' : 'pedidos'} correctamente
                  </h2>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Tus pedidos quedaron registrados. Pronto recibirás la
                    confirmación por correo.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N.º de pedido</TableHead>
                      <TableHead className="text-right">Productos</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmados.map((c) => (
                      <TableRow key={c.numero}>
                        <TableCell className="font-medium">{c.numero}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.productos}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.unidades}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCOP(c.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={descargarConfirmacion}>
                  <Download data-icon="inline-start" />
                  Descargar confirmación (CSV)
                </Button>
                <Button variant="outline" onClick={reiniciar}>
                  <RefreshCw data-icon="inline-start" />
                  Cargar otra plantilla
                </Button>
                <Button onClick={() => router.push('/')}>
                  Ir a crear pedido
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
