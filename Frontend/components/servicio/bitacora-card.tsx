'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import type { AccionBitacora, EventoBitacora } from '@/lib/types'
import { ACCION_BITACORA_LABEL } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 15

/** Umbral a partir del cual el detalle se recorta y aparece "Ver más". */
const DETALLE_CLAMP = 120

/** "dd/mm/yyyy HH:mm" en 24h, como la bitácora del sistema actual. */
function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}

/** Color por tipo de acción; mensaje y comentario usan variantes del Badge. */
const ACCION_BADGE_CLASS: Partial<Record<AccionBitacora, string>> = {
  documento_aprobado: 'bg-green-100 text-green-700 hover:bg-green-100',
  documento_solicitado: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  documento_modificado: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
}

function AccionBadge({ accion }: { accion: AccionBitacora }) {
  const label = ACCION_BITACORA_LABEL[accion]
  if (accion === 'documento_mensaje')
    return (
      <Badge variant="secondary" className="whitespace-nowrap">
        {label}
      </Badge>
    )
  if (accion === 'comentario_documento')
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        {label}
      </Badge>
    )
  return (
    <Badge className={`whitespace-nowrap ${ACCION_BADGE_CLASS[accion] ?? ''}`}>
      {label}
    </Badge>
  )
}

function Adjuntos({ adjuntos }: { adjuntos: string[] }) {
  if (adjuntos.length === 0)
    return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {adjuntos.map((a) => (
        <Badge key={a} variant="outline" className="gap-1 font-normal">
          <Paperclip className="size-3" />
          {a}
        </Badge>
      ))}
    </span>
  )
}

/** Detalle largo en 2 líneas con expansión por fila ("Ver más"/"Ver menos"). */
function Detalle({
  texto,
  expandido,
  onToggle,
}: {
  texto: string
  expandido: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <p className={`text-pretty ${expandido ? '' : 'line-clamp-2'}`}>{texto}</p>
      {texto.length > DETALLE_CLAMP && (
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-medium text-[#00359a] hover:underline"
        >
          {expandido ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  )
}

/**
 * Card de solo lectura con el historial de acciones del pedido. El dato viene
 * en orden cronológico ascendente; aquí se invierte (lo más reciente arriba).
 */
export function BitacoraCard({ eventos }: { eventos: EventoBitacora[] }) {
  const [pagina, setPagina] = React.useState(0)
  const [expandidos, setExpandidos] = React.useState<Set<string>>(new Set())

  const ordenados = React.useMemo(() => [...eventos].reverse(), [eventos])
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE))
  // Si la página quedó fuera de rango (cambió el total), cae a la última válida.
  const paginaSegura = Math.min(pagina, totalPaginas - 1)
  const visibles = ordenados.slice(
    paginaSegura * PAGE_SIZE,
    (paginaSegura + 1) * PAGE_SIZE,
  )

  const toggle = (id: string) =>
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Card className="gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-brand">Bitácora</h3>
        <p className="text-xs text-muted-foreground">
          Historial de acciones y cambios de estado del pedido.
        </p>
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-lg border">
          <p className="p-6 text-center text-sm text-muted-foreground">
            No se han creado registros.
          </p>
        </div>
      ) : (
        <>
          {/* Tabla (md+). Detalle es la columna ancha y envuelve: sin scroll horizontal. */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="w-full">Detalle</TableHead>
                  <TableHead>Adjuntos del Documento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap align-top tabular-nums">
                      {formatFechaHora(e.fecha)}
                    </TableCell>
                    <TableCell className="align-top">
                      <AccionBadge accion={e.accion} />
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        title={e.usuario}
                        className="block max-w-[180px] truncate"
                      >
                        {e.usuario}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <Detalle
                        texto={e.detalle}
                        expandido={expandidos.has(e.id)}
                        onToggle={() => toggle(e.id)}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Adjuntos adjuntos={e.adjuntos} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Lista de tarjetas apiladas (móvil). */}
          <div className="flex flex-col gap-3 md:hidden">
            {visibles.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {formatFechaHora(e.fecha)}
                  </span>
                  <AccionBadge accion={e.accion} />
                </div>
                <span
                  title={e.usuario}
                  className="truncate text-xs font-medium"
                >
                  {e.usuario}
                </span>
                <Detalle
                  texto={e.detalle}
                  expandido={expandidos.has(e.id)}
                  onToggle={() => toggle(e.id)}
                />
                <Adjuntos adjuntos={e.adjuntos} />
              </div>
            ))}
          </div>

          {/* Paginación solo cuando hay más de una página. */}
          {ordenados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Página {paginaSegura + 1} de {totalPaginas} ({ordenados.length}{' '}
                registros)
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={paginaSegura === 0}
                  onClick={() => setPagina(paginaSegura - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={paginaSegura >= totalPaginas - 1}
                  onClick={() => setPagina(paginaSegura + 1)}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
