'use client'

import * as React from 'react'
import { Label, Pie, PieChart } from 'recharts'
import type { EstadoPedido } from '@/lib/types'
import { ESTADO_LABEL } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'
import { totalesPedido } from '@/lib/order-utils'
import { formatCOP } from '@/lib/format'
import {
  CHART_COLOR_FALLBACK,
  ESTADO_COLOR,
} from '@/components/pedidos/estado-badge'
import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const ESTADOS = Object.keys(ESTADO_LABEL) as EstadoPedido[]

// Config del chart derivado del enum real + ESTADO_LABEL (no hardcodear
// estados que no existen en el modelo).
const pieConfig = Object.fromEntries(
  ESTADOS.map((e) => [
    ESTADO_LABEL[e],
    { label: ESTADO_LABEL[e], color: ESTADO_COLOR[e]?.chart ?? CHART_COLOR_FALLBACK },
  ]),
) satisfies ChartConfig

interface PieDatum {
  estado: string
  value: number
  pct: number
  total: number
  fill: string
}

export function StatusPieChart() {
  const { pedidos, getProducto } = usePortal()

  const { pieData, totalEnCola } = React.useMemo(() => {
    const totalEnCola = pedidos.length
    const pieData: PieDatum[] = ESTADOS.filter((e) =>
      pedidos.some((p) => p.estado === e),
    ).map((e) => {
      const delEstado = pedidos.filter((p) => p.estado === e)
      return {
        estado: ESTADO_LABEL[e],
        value: delEstado.length,
        pct: totalEnCola
          ? Math.round((delEstado.length / totalEnCola) * 100)
          : 0,
        total: delEstado.reduce(
          (acc, p) => acc + totalesPedido(p, getProducto).total,
          0,
        ),
        fill: ESTADO_COLOR[e]?.chart ?? CHART_COLOR_FALLBACK,
      }
    })
    return { pieData, totalEnCola }
  }, [pedidos, getProducto])

  return (
    <Card className="gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          Pedidos por estado
        </h3>
        <p className="text-xs text-muted-foreground">
          Distribución de la cola actual
        </p>
      </div>

      <ChartContainer
        config={pieConfig}
        className="mx-auto aspect-square max-h-[220px] w-full"
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="estado"
            innerRadius={55}
            strokeWidth={4}
            isAnimationActive={false}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {totalEnCola}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 22}
                        className="fill-muted-foreground text-xs"
                      >
                        pedidos
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Leyenda: punto · label · N peds. · % · valor */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {pieData.map((d) => (
          <div key={d.estado} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {d.estado}
            </span>
            <span className="w-16 text-right tabular-nums">
              {d.value} peds.
            </span>
            <span className="w-10 text-right tabular-nums text-muted-foreground">
              {d.pct}%
            </span>
            <span className="w-28 text-right font-medium tabular-nums">
              {formatCOP(d.total)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
