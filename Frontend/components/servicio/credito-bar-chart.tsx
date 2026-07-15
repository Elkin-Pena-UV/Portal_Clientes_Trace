'use client'

import * as React from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import type { EstadoCredito } from '@/lib/types'
import { ESTADO_CREDITO_LABEL } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { totalesPedido } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const ESTADOS_CREDITO = Object.keys(ESTADO_CREDITO_LABEL) as EstadoCredito[]

/** Colores del chart de crédito (verde aprobado / gris sin aprobar). */
const CREDITO_CHART_COLOR: Record<EstadoCredito, string> = {
  aprobado: '#16a34a',
  sin_aprobar: '#9ca3af',
}

const creditoConfig = Object.fromEntries(
  ESTADOS_CREDITO.map((e) => [
    ESTADO_CREDITO_LABEL[e],
    { label: ESTADO_CREDITO_LABEL[e], color: CREDITO_CHART_COLOR[e] },
  ]),
) satisfies ChartConfig

export function CreditoBarChart() {
  const { pedidos, getProducto } = usePortal()

  const creditoData = React.useMemo(
    () =>
      ESTADOS_CREDITO.map((e) => ({
        estadoCredito: ESTADO_CREDITO_LABEL[e],
        total: pedidos
          .filter((p) => p.estadoCredito === e)
          .reduce((acc, p) => acc + totalesPedido(p, getProducto).total, 0),
        fill: CREDITO_CHART_COLOR[e],
      })),
    [pedidos, getProducto],
  )

  return (
    <Card className="gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          Valor en cola por estado de crédito
        </h3>
        <p className="text-xs text-muted-foreground">
          Suma del valor de los pedidos según aprobación de crédito
        </p>
      </div>

      <ChartContainer config={creditoConfig} className="h-[180px] w-full">
        <BarChart
          data={creditoData}
          layout="vertical"
          margin={{ left: 0, right: 16 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="estadoCredito"
            width={90}
            tickLine={false}
            axisLine={false}
            className="text-xs"
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCOP(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="total" radius={6} barSize={38} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}
