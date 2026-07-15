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
import type { PuntoEntrega } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PuntoEntregaFormSheet } from '@/components/puntos-entrega/punto-entrega-form-sheet'
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

export default function PuntosEntregaPage() {
  const { puntosEntrega, deletePuntoEntrega, getSede, consumirAbrirNuevoPunto } =
    usePortal()
  const [query, setQuery] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PuntoEntrega | null>(null)
  const [toDelete, setToDelete] = React.useState<PuntoEntrega | null>(null)
  const [sedeInicial, setSedeInicial] = React.useState<string>('')

  // Si llegamos desde el flujo "Agregar nuevo punto" del pedido, abrir el
  // formulario con la sede de despacho ya pre-seleccionada.
  React.useEffect(() => {
    const solicitud = consumirAbrirNuevoPunto()
    if (solicitud) {
      setEditing(null)
      setSedeInicial(solicitud.sedeDespachoId)
      setFormOpen(true)
      toast.info('Crea el punto de entrega y vuelve a tu pedido para seleccionarlo.')
    }
  }, [consumirAbrirNuevoPunto])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return puntosEntrega
    return puntosEntrega.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.ciudad.toLowerCase().includes(q),
    )
  }, [puntosEntrega, query])

  function openCreate() {
    setEditing(null)
    setSedeInicial('')
    setFormOpen(true)
  }

  function openEdit(punto: PuntoEntrega) {
    setEditing(punto)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!toDelete) return
    deletePuntoEntrega(toDelete.id)
    toast.success(`Punto de entrega "${toDelete.nombre}" eliminado.`)
    setToDelete(null)
  }

  return (
    <DashboardLayout
      title="Puntos de entrega"
      subtitle="Gestiona los puntos de entrega y retiro"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end">
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Nuevo punto de entrega
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Listado de puntos de entrega</CardTitle>
              <CardDescription>
                {puntosEntrega.length}{' '}
                {puntosEntrega.length === 1
                  ? 'punto registrado'
                  : 'puntos registrados'}
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
                      ? 'No encontramos puntos de entrega con ese criterio de búsqueda.'
                      : 'Aún no has registrado ningún punto de entrega.'}
                  </EmptyDescription>
                </EmptyHeader>
                {!query && (
                  <EmptyContent>
                    <Button onClick={openCreate}>
                      <Plus data-icon="inline-start" />
                      Crear primer punto
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Punto de entrega</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Sede de despacho</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Dirección
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">Ciudad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((punto) => (
                      <TableRow key={punto.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{punto.nombre}</span>
                            {punto.contactoNombre && (
                              <span className="text-xs text-muted-foreground">
                                {punto.contactoNombre}
                                {punto.contactoTelefono
                                  ? ` · ${punto.contactoTelefono}`
                                  : ''}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={punto.tipo === 'obra' ? 'secondary' : 'outline'}
                            className="gap-1"
                          >
                            {punto.tipo === 'obra' ? (
                              <Building2 className="size-3" />
                            ) : (
                              <Store className="size-3" />
                            )}
                            {punto.tipo === 'obra' ? 'Obra' : 'Punto de venta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getSede(punto.sedeDespachoId)?.nombre ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {punto.direccion}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {punto.ciudad}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(punto)}
                              aria-label={`Editar ${punto.nombre}`}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDelete(punto)}
                              aria-label={`Eliminar ${punto.nombre}`}
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

        <PuntoEntregaFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          punto={editing}
          sedeDespachoInicial={sedeInicial}
        />

        <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar punto de entrega</DialogTitle>
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
