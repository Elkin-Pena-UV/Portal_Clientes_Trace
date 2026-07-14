'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TrackingPanel, type TrackingPanelData } from '@/components/pedidos/tracking-panel'
import { OrderHistory, type OrderRow } from '@/components/pedidos/order-history'

// Mock data
const mockOrders: OrderRow[] = [
  {
    id: '1',
    cod: 'T-292313',
    pvc: 'PVC-275293',
    oc: '12552',
    date: '06 jun 2026',
    location: 'Cali – Planta SC',
    value: '$14.820.000',
    status: 'entregado',
  },
  {
    id: '2',
    cod: 'T-292208',
    pvc: 'PVC-275251',
    oc: '12544',
    date: '02 jun 2026',
    location: 'Yumbo – San Marcos',
    value: '$6.720.000',
    status: 'entregado',
  },
  {
    id: '3',
    cod: 'T-291786',
    pvc: '—',
    oc: 'Prueba2011',
    date: '30 may 2026',
    location: 'Cali – Planta SC',
    value: '$21.300.000',
    status: 'en-construccion',
  },
  {
    id: '4',
    cod: 'T-291640',
    pvc: 'PVC-275190',
    oc: '12519',
    date: '28 may 2026',
    location: 'Palmira – Zona Franca',
    value: '$4.150.000',
    status: 'entregado',
  },
  {
    id: '5',
    cod: 'T-291402',
    pvc: 'PVC-275133',
    oc: '12498',
    date: '24 may 2026',
    location: 'Cali – Planta SC',
    value: '$9.840.000',
    status: 'en-transito',
  },
  {
    id: '6',
    cod: 'T-291168',
    pvc: '—',
    oc: '16510a',
    date: '19 may 2026',
    location: 'Yumbo – San Marcos',
    value: '$3.300.000',
    status: 'anulado',
  },
  {
    id: '7',
    cod: 'T-290985',
    pvc: 'PVC-275069',
    oc: '12466',
    date: '15 may 2026',
    location: 'Cali – Planta SC',
    value: '$15.600.000',
    status: 'entregado',
  },
]

// Mock tracking data for the first order
const mockTrackingData: Record<string, TrackingPanelData> = {
  'T-292313': {
    orderId: '1',
    orderCode: 'T-292313',
    status: 'completed',
    statusLabel: 'Entregado y firmado',
    statusColor: 'bg-green-100 text-green-700',
    updatedAt: '07 jun 2026 · 14:32',
    events: [
      {
        id: '1',
        title: 'Orden creada',
        date: '03 jun 2026',
        time: '09:14',
        completed: true,
      },
      {
        id: '2',
        title: 'Aprobada por cartera',
        date: '03 jun 2026',
        time: '10:45',
        completed: true,
      },
      {
        id: '3',
        title: 'PVC generado',
        date: '04 jun 2026',
        pvcCode: 'PVC-275293',
        completed: true,
      },
      {
        id: '4',
        title: 'En tránsito',
        date: '05 jun 2026',
        time: '08:00',
        completed: true,
      },
      {
        id: '5',
        title: 'Entregado y firmado',
        date: '07 jun 2026',
        time: '14:32',
        completed: true,
        detail: 'firma del receptor capturada',
      },
    ],
    pvc: 'PVC-275293',
    location: 'Cali – Planta SC',
    driver: 'Arturo Mosquera',
    plate: 'SVL886',
    items: '14 productos',
    value: '$14.820.000',
    deliveryConfirmed: true,
    remission: 'Remisión REM-2291',
    parcelCode: '#PAR-8842',
  },
}

export default function MisPedidosPage() {
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(
    mockOrders[0]
  )

  const getCurrentTracking = (): TrackingPanelData => {
    if (!selectedOrder) return mockTrackingData[mockOrders[0].cod]
    // Return mock data based on selected order
    return (
      mockTrackingData[selectedOrder.cod] || mockTrackingData[mockOrders[0].cod]
    )
  }

  const handleOrderClick = (order: OrderRow) => {
    setSelectedOrder(order)
    // Scroll to top to see the tracking panel
    if (typeof window !== 'undefined') {
      const main = document.querySelector('main')
      if (main) {
        main.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  return (
    <DashboardLayout
      title="Mis pedidos"
      subtitle="Seguimiento e historial de tus órdenes"
    >
      <div className="max-w-6xl mx-auto">
        <TrackingPanel data={getCurrentTracking()} />
        <OrderHistory orders={mockOrders} onOrderClick={handleOrderClick} />
      </div>
    </DashboardLayout>
  )
}
