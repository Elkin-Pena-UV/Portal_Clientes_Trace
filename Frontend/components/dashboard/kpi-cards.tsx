import { Shield, Wallet, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCOP } from '@/lib/format'

export function KPICards() {
  const kpis = [
    {
      id: 'cupo',
      icon: Shield,
      label: 'Cupo disponible',
      value: '$288.000.000',
      subtitle: 'de $800.000.000 asignado',
      iconColor: '#00359a',
      borderColor: '#00359a',
    },
    {
      id: 'cartera',
      icon: Wallet,
      label: 'Cartera total',
      value: '$187.450.000',
      subtitle: '$15.500.000 vencida',
      subtitleHighlight: true,
      iconColor: '#ff6600',
      borderColor: '#ff6600',
    },
    {
      id: 'pedidos',
      icon: Package,
      label: 'Pedidos activos',
      value: '2',
      subtitle: '1 en tránsito · 1 en construcción',
      iconColor: '#ff6600',
      borderColor: '#ff6600',
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.id}
            className="overflow-hidden border-l-4 p-6 w-full min-w-0"
            style={{ borderLeftColor: kpi.borderColor }}
          >
            <div className="flex gap-4 min-w-0">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${kpi.iconColor}15` }}
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: kpi.iconColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground truncate">
                  {kpi.value}
                </p>
                <p
                  className={`mt-1 text-xs truncate ${
                    kpi.subtitleHighlight
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
