'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DeliveryScheduling } from '@/components/entregas/delivery-scheduling'

export default function ProgramacionPage() {
  return (
    <DashboardLayout
      title="Programación de entregas"
      subtitle="Tus próximos despachos confirmados y programados"
    >
      <DeliveryScheduling />
    </DashboardLayout>
  )
}
