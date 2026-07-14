'use client'

import { KPICards } from './kpi-cards'
import { QuickAccessGrid } from './quick-access-grid'
import { RecentOrdersTable } from './recent-orders-table'
import { QuotaUsage } from './quota-usage'

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-6xl mx-auto">
      {/* Header — hidden on mobile since DashboardLayout shows it */}
      <div className="space-y-1 hidden md:block">
        <h1 className="text-3xl font-bold text-foreground">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu cuenta — Constructora del Pacífico S.A.S.
        </p>
      </div>

      {/* KPIs */}
      <KPICards />

      {/* Quick Access */}
      <QuickAccessGrid />

      {/* Bottom Section: Table + Quota — Responsive grid */}
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
        <div>
          <QuotaUsage />
        </div>
      </div>
    </div>
  )
}
