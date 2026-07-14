'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
} from 'lucide-react'
import type { Sede } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { SedeFormSheet } from '@/components/sedes/sede-form-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function SedesPage() {
  const { sedes, deleteSede, consumirAbrirNuevaSede } = usePortal()
  const [query, setQuery] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Sede | null>(null)
  const [toDelete, setToDelete] = React.useState<Sede | null>(null)

  // Si llegamos desde el flujo "Agregar nueva sede" del pedido, abrir el formulario.
  React.useEffect(() => {
    if (consumirAbrirNuevaSede()) {
      setEditing(null)
      setFormOpen(true)
      toast.info('Crea la sede y vuelve a tu pedido para seleccionarla.')
    }
  }, [consumirAbrirNuevaSede])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sedes
    return sedes.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        s.ciudad.toLowerCase().includes(q),
    )
  }, [sedes, query])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(sede: Sede) {
    setEditing(sede)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!toDelete) return
    deleteSede(toDelete.id)
    toast.success(`Sede "${toDelete.nombre}" eliminada.`)
    setToDelete(null)
  }

  return (
    <DashboardLayout
      title="Sedes"
      subtitle="Gestiona los puntos de entrega y retiro"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1 hidden">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Sedes
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
            Administra los puntos de entrega y retiro disponibles para tus
            pedidos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Nueva sede
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Listado de sedes</CardTitle>
            <CardDescription>
              {sedes.length} {sedes.length === 1 ? 'sede' : 'sedes'} registradas
            </CardDescription>
          </div>
          <InputGroup className="sm:w-72">
            <InputGroupInput
              placeholder="Buscar por nombre o ciudad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPin />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  {query
                    ? 'No encontramos sedes con ese criterio de búsqueda.'
                    : 'Aún no has registrado ninguna sede.'}
                </EmptyDescription>
              </EmptyHeader>
              {!query && (
                <EmptyContent>
                  <Button onClick={openCreate}>
                    <Plus data-icon="inline-start" />
                    Crear primera sede
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sede</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Dirección
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sede) => (
                    <TableRow key={sede.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{sede.nombre}</span>
                          {sede.contactoNombre && (
                            <span className="text-xs text-muted-foreground">
                              {sede.contactoNombre}
                              {sede.contactoTelefono
                                ? ` · ${sede.contactoTelefono}`
                                : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sede.tipo === 'obra' ? 'secondary' : 'outline'}
                          className="gap-1"
                        >
                          {sede.tipo === 'obra' ? (
                            <Building2 className="size-3" />
                          ) : (
                            <Store className="size-3" />
                          )}
                          {sede.tipo === 'obra' ? 'Obra' : 'Punto de venta'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {sede.direccion}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {sede.ciudad}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(sede)}
                            aria-label={`Editar ${sede.nombre}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setToDelete(sede)}
                            aria-label={`Eliminar ${sede.nombre}`}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SedeFormSheet open={formOpen} onOpenChange={setFormOpen} sede={editing} />

      <Dialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sede</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar{' '}
              <span className="font-medium text-foreground">
                {toDelete?.nombre}
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  )
}
