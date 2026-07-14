'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { WalletKPIs } from '@/components/pagos/wallet-kpis'
import { CarteraStatusTab } from '@/components/pagos/cartera-status-tab'
import { PayInvoicesTab } from '@/components/pagos/pay-invoices-tab'
import { PayAdvancesTab } from '@/components/pagos/pay-advances-tab'
import { PaymentHistory, type PagoHistorico } from '@/components/pagos/payment-history'
import { cn } from '@/lib/utils'

const mockPagos: PagoHistorico[] = [
  {
    fecha: '05 jun 2026',
    referencia: 'REF-88231',
    metodo: 'PSE',
    facturasPagadas: ['FE-4501', 'FE-4402'],
    valor: 18900000,
    estado: 'Aprobado',
  },
  {
    fecha: '28 may 2026',
    referencia: 'REF-88190',
    metodo: 'Transferencia',
    facturasPagadas: ['FE-4380'],
    valor: 6100000,
    estado: 'Aprobado',
  },
]

type TabType = 'cartera' | 'facturas' | 'anticipos' | 'historial'

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'cartera', label: 'Estado de cartera' },
  { id: 'facturas', label: 'Pagar facturas' },
  { id: 'anticipos', label: 'Pagar anticipos' },
  { id: 'historial', label: 'Historial de pagos' },
]

export default function PagosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cartera')

  return (
    <DashboardLayout
      title="Pagos"
      subtitle="Gestiona tu cartera y realiza pagos en línea"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <WalletKPIs />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'text-[#ff6600] border-[#ff6600] font-semibold'
                    : 'text-gray-500 border-transparent hover:text-gray-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'cartera' && <CarteraStatusTab />}
          {activeTab === 'facturas' && <PayInvoicesTab />}
          {activeTab === 'anticipos' && <PayAdvancesTab />}
          {activeTab === 'historial' && <PaymentHistory payments={mockPagos} />}
        </div>
      </div>
    </DashboardLayout>
  )
}
