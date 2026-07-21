'use client'

import * as React from 'react'
import { Building2, Lock } from 'lucide-react'
import { usePortal } from '@/components/portal-provider'
import { plazoLabel } from '@/lib/order-utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NuevoPedidoCabeceraProps {
  /** Cliente seleccionado (id) o null si aún no se eligió. */
  clienteId: string | null
  /** Al elegir cliente, el contenedor regenera el pedido para ese cliente. */
  onSelectCliente: (id: string) => void
  /** Plazo actual del pedido (código de PLAZOS). */
  plazoCodigo: string
  /** Cambio de plazo (limitado a los plazos habilitados del cliente). */
  onChangePlazo: (codigo: string) => void
  showErrors: boolean
}

const LABEL_CLASS =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground'

/**
 * Cabecera del flujo "Nuevo pedido" de Servicio al Cliente: selecciona el
 * cliente y muestra sus condiciones comerciales. La forma de pago es de solo
 * lectura (viene del cliente) y el plazo se limita a los plazos habilitados
 * del cliente (D3). El estado de crédito del cliente igual se copia al pedido
 * (ver `nuevoPedidoParaCliente`), pero aquí no se muestra: lo consumen el
 * listado de pedidos y el gráfico de crédito del dashboard.
 */
export function NuevoPedidoCabecera({
  clienteId,
  onSelectCliente,
  plazoCodigo,
  onChangePlazo,
  showErrors,
}: NuevoPedidoCabeceraProps) {
  const { clientes, getCliente } = usePortal()
  const cliente = clienteId ? getCliente(clienteId) : undefined

  const clienteItems = React.useMemo(
    () => clientes.map((c) => ({ value: c.id, label: c.nombre })),
    [clientes],
  )

  const esContado = cliente?.formaPago === 'Contado'
  const plazoItems = React.useMemo(
    () =>
      (cliente?.plazosDisponibles ?? []).map((codigo) => ({
        value: codigo,
        label: plazoLabel(codigo),
      })),
    [cliente],
  )

  return (
    <Card className="gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-brand">Cliente y condiciones</h3>
        <p className="text-xs text-muted-foreground">
          Selecciona el cliente para el que creas el pedido. La forma de pago y
          el plazo se derivan de sus condiciones comerciales.
        </p>
      </div>

      <div className="grid items-start gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1.5fr)_auto_minmax(220px,1.5fr)]">
        {/* CLIENTE */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label className={LABEL_CLASS}>Cliente</Label>
          <Select
            items={clienteItems}
            value={clienteId}
            onValueChange={(v) => v && onSelectCliente(v as string)}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={showErrors && !clienteId}
            >
              <SelectValue placeholder="Selecciona el cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {clienteItems.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {showErrors && !clienteId && (
            <span className="text-sm font-medium text-destructive">
              Selecciona un cliente.
            </span>
          )}
          {cliente && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              NIT {cliente.nit}
            </span>
          )}
        </div>

        {/* FORMA DE PAGO — solo badge, ancho automático. NO editable. */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label className={LABEL_CLASS}>Forma de pago</Label>
          <div className="flex h-9 items-center">
            {cliente ? (
              <Badge
                variant={esContado ? 'secondary' : 'default'}
                className="gap-1"
              >
                <Lock className="size-3" />
                {cliente.formaPago}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Definida por el cliente, no editable.
          </span>
        </div>

        {/* PLAZO — limitado a los plazos del cliente. Contado -> bloqueado. */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label className={LABEL_CLASS}>Plazo</Label>
          <Select
            items={plazoItems}
            value={cliente ? plazoCodigo : null}
            onValueChange={(v) => v && onChangePlazo(v as string)}
            disabled={!cliente || esContado}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona el plazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {plazoItems.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {esContado && (
            <span className="text-xs text-muted-foreground">
              Contado: plazo fijo.
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
