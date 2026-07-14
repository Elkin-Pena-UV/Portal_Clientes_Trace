'use client'

import { useMemo, useState } from 'react'
import { Download, Eye, FileSpreadsheet, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DocumentoFinanciero {
  emision: string
  tipo: 'FVE' | 'NC' | 'ND'
  documento: string
  descripcion: string
  pedido: string
  ordenCompra: string
  nit: string
  valor: number
}

interface DocumentoLogistico {
  emision: string
  tipo: 'Remisión' | 'Devolución'
  documento: string
  pedido: string
  firmaDigital: 'Validada' | 'Pendiente'
  valor: number
}

const financieros: DocumentoFinanciero[] = [
  { emision: '21 may 2026', tipo: 'FVE', documento: 'FVE-44821', descripcion: 'Factura de venta', pedido: 'PVC-292313', ordenCompra: 'OC-12345', nit: '830.221.554-8', valor: 18420000 },
  { emision: '21 may 2026', tipo: 'FVE', documento: 'FVE-44822', descripcion: 'Factura de venta', pedido: 'PVC-292314', ordenCompra: 'OC-12346', nit: '830.221.554-8', valor: 18420000 },
  { emision: '21 may 2026', tipo: 'FVE', documento: 'FVE-44823', descripcion: 'Factura de venta', pedido: 'PVC-292315', ordenCompra: 'OC-12347', nit: '830.221.554-8', valor: 18420000 },
  { emision: '18 may 2026', tipo: 'NC', documento: 'NC-1182', descripcion: 'Nota crédito', pedido: 'PVC-291786', ordenCompra: 'OC-12348', nit: '830.221.554-8', valor: -1340000 },
  { emision: '19 may 2026', tipo: 'FVE', documento: 'FVE-44780', descripcion: 'Factura de venta', pedido: 'PVC-292208', ordenCompra: 'OC-12349', nit: '830.221.554-8', valor: 12750000 },
  { emision: '12 may 2026', tipo: 'ND', documento: 'ND-0421', descripcion: 'Nota débito', pedido: 'PVC-290985', ordenCompra: 'OC-12350', nit: '830.221.554-8', valor: 54000 },
]

const logisticos: DocumentoLogistico[] = [
  { emision: '06 jun 2026', tipo: 'Remisión', documento: 'REM-2291', pedido: 'PVC-292313', firmaDigital: 'Validada', valor: 14820000 },
  { emision: '02 jun 2026', tipo: 'Remisión', documento: 'REM-2274', pedido: 'PVC-292208', firmaDigital: 'Validada', valor: 6720000 },
  { emision: '27 may 2026', tipo: 'Devolución', documento: 'DEV-0455', pedido: 'PVC-291640', firmaDigital: 'Validada', valor: -880000 },
]

const money = (value: number) => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('es-CO')}`

function downloadText(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function DocumentsWorkspace() {
  const [tab, setTab] = useState('financieros')
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<DocumentoLogistico | null>(null)

  const visibleIds = useMemo(
    () => tab === 'financieros' ? financieros.map((item) => item.documento) : logisticos.map((item) => item.documento),
    [tab]
  )
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id))

  const changeTab = (value: string) => {
    setTab(value)
    setSelected([])
  }

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id))
  }

  const selectedOrAll = selected.length > 0 ? selected : visibleIds

  const exportDocuments = () => {
    downloadText(`documentos-${tab}.csv`, `Documento\n${selectedOrAll.join('\n')}`)
  }

  const downloadDocuments = () => {
    downloadText(`documentos-${tab}.pdf`, `Documentos seleccionados:\n${selectedOrAll.join('\n')}`)
  }

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">Mis documentos</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={exportDocuments}>
              <FileSpreadsheet data-icon="inline-start" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none" onClick={downloadDocuments}>
              <Download data-icon="inline-start" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={changeTab}>
          <div className="-mx-4 overflow-x-auto border-b px-4 md:mx-0 md:px-0">
            <TabsList variant="line" className="h-auto min-w-max gap-6 p-0">
              <TabsTrigger value="financieros" className="flex-none px-0 pb-3 data-active:text-[#ff6600] data-active:after:bg-[#ff6600]">
                Facturas y Notas
              </TabsTrigger>
              <TabsTrigger value="logisticos" className="flex-none px-0 pb-3 data-active:text-[#ff6600] data-active:after:bg-[#ff6600]">
                Remisiones y Devoluciones
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="financieros" className="pt-4">
            <div className="hidden md:block">
              <FinancialTable selected={selected} allSelected={allSelected} onToggle={toggle} onToggleAll={(checked) => setSelected(checked ? visibleIds : [])} />
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {financieros.map((item) => (
                <FinancialCard key={item.documento} item={item} checked={selected.includes(item.documento)} onToggle={(checked) => toggle(item.documento, checked)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logisticos" className="pt-4">
            <div className="hidden md:block">
              <LogisticsTable selected={selected} allSelected={allSelected} onToggle={toggle} onToggleAll={(checked) => setSelected(checked ? visibleIds : [])} onPreview={setPreview} />
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {logisticos.map((item) => (
                <LogisticsCard key={item.documento} item={item} checked={selected.includes(item.documento)} onToggle={(checked) => toggle(item.documento, checked)} onPreview={() => setPreview(item)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Vista previa — {preview?.documento}</DialogTitle>
            <DialogDescription>Documento logístico asociado al pedido {preview?.pedido}.</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border bg-muted/40 text-center">
            <FileText className="size-12 text-[#00359a]" aria-hidden="true" />
            <p className="font-semibold">{preview?.tipo} digital</p>
            <p className="text-sm text-muted-foreground">La vista del PDF estará disponible desde CarteraOS.</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function TypeBadge({ type }: { type: DocumentoFinanciero['tipo'] }) {
  return <Badge className={cn(type === 'FVE' && 'bg-blue-100 text-blue-700', type === 'NC' && 'bg-orange-100 text-orange-700', type === 'ND' && 'bg-gray-100 text-gray-600')}>{type}</Badge>
}

function SignatureBadge({ state }: { state: DocumentoLogistico['firmaDigital'] }) {
  return <Badge className={state === 'Validada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}><span className="size-1.5 rounded-full bg-current" />{state}</Badge>
}

function FinancialTable({ selected, allSelected, onToggle, onToggleAll }: { selected: string[]; allSelected: boolean; onToggle: (id: string, checked: boolean) => void; onToggleAll: (checked: boolean) => void }) {
  return <Table><TableHeader><TableRow className="border-b-2 border-[#00359a]"><TableHead><Checkbox aria-label="Seleccionar todas las facturas" checked={allSelected} onCheckedChange={(checked) => onToggleAll(Boolean(checked))} /></TableHead>{['EMISIÓN', 'FN', 'DOCUMENTO', 'PEDIDO', 'ORDEN DE COMPRA', 'NIT', 'VALOR', ''].map((heading) => <TableHead key={heading} className="whitespace-nowrap text-xs font-semibold text-[#00359a]">{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{financieros.map((item) => <TableRow key={item.documento}><TableCell><Checkbox aria-label={`Seleccionar ${item.documento}`} checked={selected.includes(item.documento)} onCheckedChange={(checked) => onToggle(item.documento, Boolean(checked))} /></TableCell><TableCell className="whitespace-nowrap">{item.emision}</TableCell><TableCell><TypeBadge type={item.tipo} /></TableCell><TableCell><p className="font-semibold">{item.documento}</p><p className="text-xs text-muted-foreground">{item.descripcion}</p></TableCell><TableCell className="whitespace-nowrap">{item.pedido}</TableCell><TableCell className="whitespace-nowrap">{item.ordenCompra}</TableCell><TableCell className="whitespace-nowrap">{item.nit}</TableCell><TableCell className={cn('whitespace-nowrap font-semibold', item.valor < 0 && 'text-destructive')}>{money(item.valor)}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => downloadText(`${item.documento}.pdf`, item.documento)}><Download data-icon="inline-start" />PDF</Button></TableCell></TableRow>)}</TableBody></Table>
}

function LogisticsTable({ selected, allSelected, onToggle, onToggleAll, onPreview }: { selected: string[]; allSelected: boolean; onToggle: (id: string, checked: boolean) => void; onToggleAll: (checked: boolean) => void; onPreview: (item: DocumentoLogistico) => void }) {
  return <Table><TableHeader><TableRow className="border-b-2 border-[#00359a]"><TableHead><Checkbox aria-label="Seleccionar todos los documentos logísticos" checked={allSelected} onCheckedChange={(checked) => onToggleAll(Boolean(checked))} /></TableHead>{['EMISIÓN', 'TIPO', 'DOCUMENTO', 'PEDIDO', 'FIRMA DIGITAL', 'VALOR', ''].map((heading) => <TableHead key={heading} className="whitespace-nowrap text-xs font-semibold text-[#00359a]">{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{logisticos.map((item) => <TableRow key={item.documento}><TableCell><Checkbox aria-label={`Seleccionar ${item.documento}`} checked={selected.includes(item.documento)} onCheckedChange={(checked) => onToggle(item.documento, Boolean(checked))} /></TableCell><TableCell className="whitespace-nowrap">{item.emision}</TableCell><TableCell><Badge className={item.tipo === 'Remisión' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}>{item.tipo}</Badge></TableCell><TableCell className="font-semibold">{item.documento}</TableCell><TableCell>{item.pedido}</TableCell><TableCell><SignatureBadge state={item.firmaDigital} /></TableCell><TableCell className={cn('whitespace-nowrap font-semibold', item.valor < 0 && 'text-destructive')}>{money(item.valor)}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => onPreview(item)}><Eye data-icon="inline-start" />Vista previa</Button></TableCell></TableRow>)}</TableBody></Table>
}

function FinancialCard({ item, checked, onToggle }: { item: DocumentoFinanciero; checked: boolean; onToggle: (checked: boolean) => void }) {
  return <article className="relative flex flex-col gap-3 rounded-lg border p-4"><Checkbox className="absolute right-4 top-4" aria-label={`Seleccionar ${item.documento}`} checked={checked} onCheckedChange={(value) => onToggle(Boolean(value))} /><div className="flex items-center gap-2 pr-8"><TypeBadge type={item.tipo} /><span className="text-xs text-muted-foreground">{item.emision}</span></div><div><p className="font-semibold text-[#00359a]">{item.documento}</p><p className="text-xs text-muted-foreground">{item.descripcion}</p></div><dl className="grid grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Pedido</dt><dd className="text-right font-medium">{item.pedido}</dd><dt className="text-muted-foreground">Orden de compra</dt><dd className="text-right font-medium">{item.ordenCompra}</dd><dt className="text-muted-foreground">NIT</dt><dd className="text-right">{item.nit}</dd><dt className="text-muted-foreground">Valor</dt><dd className={cn('text-right font-semibold', item.valor < 0 && 'text-destructive')}>{money(item.valor)}</dd></dl><Button variant="outline" onClick={() => downloadText(`${item.documento}.pdf`, item.documento)}><Download data-icon="inline-start" />Descargar PDF</Button></article>
}

function LogisticsCard({ item, checked, onToggle, onPreview }: { item: DocumentoLogistico; checked: boolean; onToggle: (checked: boolean) => void; onPreview: () => void }) {
  return <article className="relative flex flex-col gap-3 rounded-lg border p-4"><Checkbox className="absolute right-4 top-4" aria-label={`Seleccionar ${item.documento}`} checked={checked} onCheckedChange={(value) => onToggle(Boolean(value))} /><div className="flex items-center gap-2 pr-8"><Badge className={item.tipo === 'Remisión' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}>{item.tipo}</Badge><span className="text-xs text-muted-foreground">{item.emision}</span></div><p className="font-semibold text-[#00359a]">{item.documento}</p><dl className="grid grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Pedido</dt><dd className="text-right font-medium">{item.pedido}</dd><dt className="text-muted-foreground">Firma digital</dt><dd className="flex justify-end"><SignatureBadge state={item.firmaDigital} /></dd><dt className="text-muted-foreground">Valor</dt><dd className={cn('text-right font-semibold', item.valor < 0 && 'text-destructive')}>{money(item.valor)}</dd></dl><Button variant="outline" onClick={onPreview}><Eye data-icon="inline-start" />Vista previa</Button></article>
}
