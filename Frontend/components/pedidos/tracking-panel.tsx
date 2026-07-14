'use client'

import React from 'react'
import { Check, Download, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TrackingEvent {
  id: string
  title: string
  date: string
  time?: string
  completed: boolean
  pvcCode?: string
  detail?: string
}

export interface TrackingPanelData {
  orderId: string
  orderCode: string
  status: 'completed' | 'in-transit' | 'pending'
  statusLabel: string
  statusColor: string
  updatedAt: string
  events: TrackingEvent[]
  pvc: string
  location: string
  driver: string
  plate: string
  items: string
  value: string
  deliveryConfirmed: boolean
  remission?: string
  parcelCode?: string
}

interface TrackingPanelProps {
  data: TrackingPanelData
}

export function TrackingPanel({ data }: TrackingPanelProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-0">
        <div className="space-y-2 pb-4 border-b border-gray-100">
          <CardTitle className="text-base font-bold">
            Seguimiento — {data.orderCode}
          </CardTitle>
          <Badge className={cn(
            'inline-flex items-center gap-1.5',
            data.statusColor
          )}>
            <span className="size-1.5 rounded-full bg-current" />
            {data.statusLabel}
          </Badge>
          <p className="text-xs text-gray-500">
            Actualizado: {data.updatedAt}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:border-l md:border-gray-200">
          {/* Timeline */}
          <div className="md:col-span-2">
            <div className="relative flex flex-col">
              {data.events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Vertical line (only if not last event) */}
                  {index < data.events.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#ff6600] -translate-x-1/2" />
                  )}
                  {/* Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={cn(
                      'flex items-center justify-center size-8 rounded-full border-2 font-bold text-sm',
                      event.completed
                        ? 'bg-[#ff6600] border-[#ff6600] text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    )}>
                      {event.completed ? <Check className="size-5" /> : ''}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      {event.title}
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.pvcCode ? (
                        <div>{event.pvcCode} · {event.date}</div>
                      ) : (
                        <div>{event.date} {event.time ? `· ${event.time}` : ''}</div>
                      )}
                    </div>
                    {event.detail && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Despacho Details — below timeline on mobile, side panel on desktop */}
          <div className="col-span-1 md:col-span-1 md:pl-6 md:bg-gray-50 md:rounded-lg md:p-6 md:-m-6 md:ml-0">
            <h4 className="text-sm font-semibold md:hidden mb-4">Detalle del despacho</h4>
            {/* Details list */}
            <div className="space-y-0 text-sm">
              <div className="flex justify-between gap-2 py-3 border-b border-gray-50">
                <span className="text-muted-foreground">PVC:</span>
                <span className="font-semibold text-foreground">{data.pvc}</span>
              </div>
              <div className="flex justify-between gap-2 py-3 border-b border-gray-50">
                <span className="text-muted-foreground">Sede:</span>
                <span className="font-semibold text-foreground text-right">{data.location}</span>
              </div>
              <div className="flex justify-between gap-2 py-3 border-b border-gray-50">
                <span className="text-muted-foreground">Conductor:</span>
                <span className="font-semibold text-foreground">{data.driver}</span>
              </div>
              <div className="flex justify-between gap-2 py-3 border-b border-gray-50">
                <span className="text-muted-foreground">Placa:</span>
                <span className="font-semibold text-foreground">{data.plate}</span>
              </div>
              <div className="flex justify-between gap-2 py-3 border-b border-gray-50">
                <span className="text-muted-foreground">Ítems:</span>
                <span className="font-semibold text-foreground">{data.items}</span>
              </div>
              <div className="flex justify-between gap-2 py-3 pt-2 md:border-t">
                <span className="text-muted-foreground">Valor con IVA:</span>
                <span className="font-bold text-[#00359a]">{data.value}</span>
              </div>
            </div>

            {/* Delivery confirmation */}
            {data.deliveryConfirmed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                  <h5 className="font-semibold text-sm text-green-900">
                    Cumplido de entrega disponible
                  </h5>
                </div>
                <p className="text-xs text-green-700">
                  {data.remission} firmada · {data.parcelCode}
                </p>
              </div>
            )}

            {/* Download button */}
            <Button className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
              <Download className="size-4" />
              Descargar cumplido
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
