'use client'

import { useEffect, useState } from 'react'
import { Frown, Meh, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type Calificacion = 'insatisfecho' | 'neutral' | 'satisfecho'

interface CalificarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documento: string
  pedido: string
  emision: string
  valor: string
  onSubmit: (data: { calificacion: Calificacion; comentario: string }) => void
}

const opciones = [
  { valor: 'insatisfecho', Icon: Frown, label: 'Insatisfecho', accent: 'border-rose-400 bg-rose-50 text-rose-600' },
  { valor: 'neutral', Icon: Meh, label: 'Neutral', accent: 'border-amber-400 bg-amber-50 text-amber-600' },
  { valor: 'satisfecho', Icon: Smile, label: 'Satisfecho', accent: 'border-green-400 bg-green-50 text-green-600' },
] as const

export function CalificarDialog({ open, onOpenChange, documento, pedido, emision, valor, onSubmit }: CalificarDialogProps) {
  const [calificacion, setCalificacion] = useState<Calificacion | null>(null)
  const [comentario, setComentario] = useState('')

  // Resetea el estado cada vez que se abre el dialog.
  useEffect(() => {
    if (open) {
      setCalificacion(null)
      setComentario('')
    }
  }, [open])

  const handleSubmit = () => {
    if (!calificacion) return
    onSubmit({ calificacion, comentario })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Califícanos</DialogTitle>
          <DialogDescription>Cuéntanos cómo fue tu experiencia con este pedido.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <dt className="text-muted-foreground">Remisión</dt>
          <dd className="text-right font-medium">{documento}</dd>
          <dt className="text-muted-foreground">Pedido</dt>
          <dd className="text-right font-medium">{pedido}</dd>
          <dt className="text-muted-foreground">Emisión</dt>
          <dd className="text-right font-medium">{emision}</dd>
          <dt className="text-muted-foreground">Valor</dt>
          <dd className="text-right font-semibold">{valor}</dd>
          <dd className="col-span-2 pt-1 text-xs text-muted-foreground">Remisión entregada y validada digitalmente.</dd>
        </dl>

        <div className="flex justify-center gap-3">
          {opciones.map(({ valor: valorOpcion, Icon, label, accent }) => (
            <button
              key={valorOpcion}
              type="button"
              onClick={() => setCalificacion(valorOpcion)}
              aria-pressed={calificacion === valorOpcion}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition',
                calificacion === valorOpcion ? accent : 'border-muted text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="size-8" aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <Textarea
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          placeholder="Comentarios (opcional)"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!calificacion}>
            Enviar calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
