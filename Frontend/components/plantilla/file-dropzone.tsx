'use client'

import * as React from 'react'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_TAMANO_MB } from '@/lib/plantilla/constants'

interface FileDropzoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function validar(file: File): string | null {
    const esXlsx =
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.type === XLSX_MIME
    if (!esXlsx) return 'Solo se permiten archivos .xlsx'
    if (file.size > MAX_TAMANO_MB * 1024 * 1024)
      return `El archivo supera el máximo de ${MAX_TAMANO_MB} MB.`
    return null
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    const err = validar(file)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (disabled) return
          handleFile(e.dataTransfer.files?.[0])
        }}
        aria-label="Cargar archivo Excel"
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors outline-none',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/40',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full transition-colors',
            dragging ? 'bg-primary text-primary-foreground' : 'bg-brand/10 text-brand',
          )}
        >
          <UploadCloud className="size-7" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold">
            {dragging
              ? 'Suelta el archivo aquí'
              : 'Arrastra tu plantilla o haz clic para seleccionar'}
          </span>
          <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" />
            Formato .xlsx · Máximo {MAX_TAMANO_MB} MB
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
