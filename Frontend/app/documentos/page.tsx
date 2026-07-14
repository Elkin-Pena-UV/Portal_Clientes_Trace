import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DocumentsWorkspace } from '@/components/documentos/documents-workspace'

export default function DocumentosPage() {
  return (
    <DashboardLayout
      title="Documentos"
      subtitle="Facturas, notas, remisiones y devoluciones"
    >
      <DocumentsWorkspace />
    </DashboardLayout>
  )
}
