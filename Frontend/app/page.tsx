'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Dashboard } from '@/components/dashboard/dashboard'

export default function HomePage() {
  return (
    <DashboardLayout
      title="Inicio"
      subtitle="Resumen de tu cuenta — Constructora Restrepo"
    >
      <Dashboard />
    </DashboardLayout>
  )
}
