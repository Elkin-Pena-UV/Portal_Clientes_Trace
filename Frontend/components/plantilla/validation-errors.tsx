'use client'

import { AlertTriangle, Download } from 'lucide-react'
import type { ErrorFila } from '@/lib/plantilla/constants'
import { generarReporteErrores } from '@/lib/plantilla/process'
import { descargarBlob } from '@/lib/plantilla/template'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ValidationErrorsProps {
  errores: ErrorFila[]
}

export function ValidationErrors({ errores }: ValidationErrorsProps) {
  if (errores.length === 0) return null

  function descargarReporte() {
    const blob = generarReporteErrores(errores)
    descargarBlob(blob, 'CementoYa_Reporte_Errores.csv')
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>
        Se encontraron {errores.length}{' '}
        {errores.length === 1 ? 'incidencia' : 'incidencias'} en la plantilla
      </AlertTitle>
      <AlertDescription className="flex w-full flex-col gap-3">
        <p>
          Las filas con errores se omitieron del lote. Corrige el Excel y vuelve
          a subirlo, o continúa solo con los pedidos válidos.
        </p>

        <div className="w-full overflow-hidden rounded-lg border bg-card">
          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Fila</TableHead>
                  <TableHead className="w-48">Columna</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errores.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium tabular-nums text-foreground">
                      {e.fila || '—'}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 shrink-0 text-primary" />
                        {e.columna}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span className="flex items-center gap-2">
                        {e.mensaje}
                        <Badge
                          variant={e.severidad === 'error' ? 'destructive' : 'secondary'}
                          className="shrink-0"
                        >
                          {e.severidad}
                        </Badge>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={descargarReporte}
          className="self-start"
        >
          <Download data-icon="inline-start" />
          Descargar reporte de errores (CSV)
        </Button>
      </AlertDescription>
    </Alert>
  )
}
