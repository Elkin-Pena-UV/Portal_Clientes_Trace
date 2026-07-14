import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ProductCatalog } from '@/components/producto/product-catalog'

export default function ProductoPage() {
  return (
    <DashboardLayout
      title="Producto"
      subtitle="Fichas técnicas del catálogo"
    >
      <ProductCatalog />
    </DashboardLayout>
  )
}
