'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Factory, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  const { sedes, deleteSede } = usePortal()
  const [query, setQuery] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Sede | null>(null)
  const [toDelete, setToDelete] = React.useState<Sede | null>(null)

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
      subtitle="Sucursales y plantas de despacho de la compañía"
    >
      <div className="mx-auto w-full max-w-6xl">

        <Card className="mt-6">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Listado de sedes</CardTitle>
              <CardDescription>
                {sedes.length} {sedes.length === 1 ? 'sede' : 'sedes'} de
                despacho registradas
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
                    <Factory />
                  </EmptyMedia>
                  <EmptyTitle>Sin resultados</EmptyTitle>
                  <EmptyDescription>
                    {query
                      ? 'No encontramos sedes con ese criterio de búsqueda.'
                      : 'Aún no hay sedes de despacho registradas.'}
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
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Dirección
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((sede) => (
                      <TableRow key={sede.id}>
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium">
                            <Factory className="size-4 text-muted-foreground" />
                            {sede.nombre}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {sede.ciudad}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {sede.direccion}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              sede.activa
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                            }
                          >
                            {sede.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
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

        <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar sede</DialogTitle>
              <DialogDescription>
                ¿Seguro que deseas eliminar{' '}
                <span className="font-medium text-foreground">
                  {toDelete?.nombre}
                </span>
                ? Los puntos de entrega asignados quedarán sin sede de despacho.
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
