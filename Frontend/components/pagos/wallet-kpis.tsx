import { Wallet, AlertTriangle, Clock, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WalletKPI {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  borderColor: string
  valueColor?: string
}

export function WalletKPIs() {
  const kpis: WalletKPI[] = [
    {
      icon: <Wallet className="size-6" />,
      title: 'Cartera total',
      value: '$187.450.000',
      subtitle: 'Saldo total pendiente',
      borderColor: 'border-l-[#00359a]',
    },
    {
      icon: <AlertTriangle className="size-6 text-red-600" />,
      title: 'Cartera vencida',
      value: '$15.500.000',
      subtitle: '3 facturas vencidas',
      borderColor: 'border-l-red-600',
      valueColor: 'text-red-600',
    },
    {
      icon: <Clock className="size-6 text-[#ff6600]" />,
      title: 'Por vencer',
      value: '$42.300.000',
      subtitle: 'Vence entre el 12–20 jul',
      borderColor: 'border-l-[#ff6600]',
    },
    {
      icon: <Shield className="size-6 text-[#00359a]" />,
      title: 'Cupo disponible',
      value: '$288.000.000',
      subtitle: 'de $800.000.000 asignado',
      borderColor: 'border-l-[#00359a]',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <Card
          key={idx}
          className={cn('border-l-4', kpi.borderColor, 'border-r-0 border-t-0 border-b-0')}
        >
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[#00359a]">{kpi.icon}</div>
              <span className="text-xs font-medium text-gray-500">{kpi.title}</span>
            </div>
            <div className={cn('text-2xl font-bold mb-1', kpi.valueColor || 'text-gray-900')}>
              {kpi.value}
            </div>
            <p className="text-sm text-gray-600">{kpi.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
