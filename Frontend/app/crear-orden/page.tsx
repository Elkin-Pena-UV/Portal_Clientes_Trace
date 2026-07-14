'use client'

import React from 'react'
import { FilePlus, FileSpreadsheet } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderBuilder } from '@/components/ordenes/order-builder'
import { ExcelImportWizard } from '@/components/plantilla/excel-import-wizard'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function CrearOrdenPage() {
  const [activeTab, setActiveTab] = React.useState('pedido')

  return (
    <DashboardLayout
      title="Crear orden"
      subtitle="Crea pedidos manualmente o cárgalos masivamente desde Excel"
      hasFixedBottomBar={true}
      hideFooter={false}
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* Segmented Control Tabs — Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto mb-6 border-0 h-auto">
            <TabsTrigger
              value="pedido"
              className="inline-flex items-center justify-center gap-2 px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
            >
              <FilePlus className="size-4" />
              <span className="hidden sm:inline">Crear pedido</span>
              <span className="sm:hidden">Pedido</span>
            </TabsTrigger>
            <TabsTrigger
              value="excel"
              className="inline-flex items-center justify-center gap-2 px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-[#ff6600] data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
            >
              <FileSpreadsheet className="size-4" />
              <span className="hidden sm:inline">Cargar Excel</span>
              <span className="sm:hidden">Excel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedido" className="mt-0">
            <OrderBuilder />
          </TabsContent>

          <TabsContent value="excel" className="mt-0">
            <ExcelImportWizard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
