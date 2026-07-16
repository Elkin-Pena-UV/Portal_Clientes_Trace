'use client'

import {
  Download,
  Droplet,
  Info,
  Layers,
  PaintBucket,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Category = 'cemento' | 'granel' | 'estuco' | 'boquilla' | 'mortero'

interface TechnicalSheet {
  name: string
  sku: string
  presentation: string
  category: Category
  updatedAt: string | null
  available: boolean
  pdfUrl: string | null
}

const technicalSheets: TechnicalSheet[] = [
  { name: 'Cemento Hidráulico Tipo UG x 50 kg', sku: 'CEM-UG-50', presentation: 'Saco 50 kg', category: 'cemento', updatedAt: '17 de may de 2026', available: true, pdfUrl: null },
  { name: 'Cemento Hidráulico Tipo UG x 25 kg', sku: 'CEM-UG-25', presentation: 'Saco 25 kg', category: 'cemento', updatedAt: '17 de may de 2026', available: true, pdfUrl: null },
  { name: 'Cemento ART Granel', sku: 'CEM-ART-GRA', presentation: 'Tonelada', category: 'granel', updatedAt: '29 de abr de 2026', available: true, pdfUrl: null },
  { name: 'Cemento Tiper Saco x 50 kg', sku: 'CEM-TIP-50', presentation: 'Saco 50 kg', category: 'cemento', updatedAt: null, available: false, pdfUrl: null },
  { name: 'Estuco Interior DanMarcos x 25 kg', sku: 'EST-INT-25', presentation: 'Saco 25 kg', category: 'estuco', updatedAt: '01 de may de 2026', available: true, pdfUrl: null },
  { name: 'Estuco Relleno Exterior DanMarcos x 25 kg', sku: 'EST-EXT-25', presentation: 'Saco 25 kg', category: 'estuco', updatedAt: '10 de mar de 2026', available: true, pdfUrl: null },
  { name: 'Boquilla Blanca x 2 kg', sku: 'BOQ-BLA-2', presentation: 'Bolsa 2 kg', category: 'boquilla', updatedAt: null, available: false, pdfUrl: null },
  { name: 'Boquilla Tabaco x 2 kg', sku: 'BOQ-TAB-2', presentation: 'Bolsa 2 kg', category: 'boquilla', updatedAt: null, available: false, pdfUrl: null },
  { name: 'Mortero Seco Pega x 40 kg', sku: 'MOR-SEC-40', presentation: 'Saco 40 kg', category: 'mortero', updatedAt: '24 de may de 2026', available: true, pdfUrl: null },
]

const categoryStyles: Record<Category, { icon: LucideIcon; surface: string; iconColor: string; label: string }> = {
  cemento: { icon: ShoppingBag, surface: 'bg-orange-50', iconColor: 'text-[#ff6600]', label: 'Cemento' },
  granel: { icon: Truck, surface: 'bg-blue-50', iconColor: 'text-[#00359a]', label: 'Granel' },
  estuco: { icon: PaintBucket, surface: 'bg-green-50', iconColor: 'text-green-600', label: 'Estuco' },
  boquilla: { icon: Droplet, surface: 'bg-purple-50', iconColor: 'text-purple-600', label: 'Boquilla' },
  mortero: { icon: Layers, surface: 'bg-gray-50', iconColor: 'text-gray-600', label: 'Mortero' },
}

function simulateDownload(sheet: TechnicalSheet) {
  const contents = `Ficha técnica\n\nProducto: ${sheet.name}\nSKU: ${sheet.sku}\nPresentación: ${sheet.presentation}\nActualizada: ${sheet.updatedAt}`
  const file = new Blob([contents], { type: 'application/pdf' })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = sheet.pdfUrl ?? url
  anchor.download = `ficha-tecnica-${sheet.sku}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
  toast.success(`Descargando ficha de ${sheet.sku}`)
}

function ProductCard({ sheet }: { sheet: TechnicalSheet }) {
  const category = categoryStyles[sheet.category]
  const Icon = category.icon

  return (
    <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-md">
            <CardHeader className={cn('relative flex h-28 items-center justify-center border-b px-6 py-6', category.surface)}>
        <div className="flex flex-col items-center gap-2">
          <Icon aria-hidden="true" className={cn('size-10', category.iconColor)} strokeWidth={1.6} />
          <span className={cn('text-xs font-semibold uppercase tracking-wider', category.iconColor)}>{category.label}</span>
        </div>
        {!sheet.available && (
          <Badge className="absolute right-4 top-4 border-amber-200 bg-amber-100 text-amber-700">Pendiente</Badge>
        )}
      </CardHeader>

      <CardContent className="flex min-h-32 flex-col gap-2 px-5 py-4">
        <CardTitle className="text-base leading-snug text-pretty">{sheet.name}</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          SKU: {sheet.sku} <span aria-hidden="true">·</span> {sheet.presentation}
        </p>
        {sheet.updatedAt && (
          <p className="mt-auto text-xs text-muted-foreground">Actualizada: {sheet.updatedAt}</p>
        )}
      </CardContent>

      <CardFooter className="px-5 pb-5">
        <Button
          variant="outline"
          className="w-full"
          disabled={!sheet.available}
          onClick={() => simulateDownload(sheet)}
        >
          {sheet.available && <Download data-icon="inline-start" />}
          {sheet.available ? 'Descargar PDF' : 'No disponible'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ProductCatalog() {
  const unavailable = technicalSheets.filter((sheet) => !sheet.available)
  const availableCount = technicalSheets.length - unavailable.length

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pt-4 md:pt-6">
      {unavailable.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <Info aria-hidden="true" className="text-[#ff6600]" />
          <AlertTitle>Fichas pendientes</AlertTitle>
          <AlertDescription className="leading-relaxed text-amber-900">
            {unavailable.length} producto(s) aún no tienen ficha técnica disponible ({unavailable.map((sheet) => sheet.sku).join(', ')}). El área comercial las cargará próximamente.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="technical-sheets-title" className="flex flex-col gap-5 pb-12 md:pb-16">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6600]">Catálogo técnico</p>
            <h2 id="technical-sheets-title" className="text-xl font-bold text-balance text-foreground">Fichas técnicas por producto</h2>
          </div>
          <Badge variant="secondary" className="shrink-0">{availableCount} disponibles</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {technicalSheets.map((sheet) => <ProductCard key={sheet.sku} sheet={sheet} />)}
        </div>
      </section>
    </div>
  )
}
