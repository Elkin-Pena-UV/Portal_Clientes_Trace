export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPct(decimal: number): string {
  return `${Math.round(decimal * 100)}%`
}

/** Convierte una fecha ISO (yyyy-mm-dd) a un Date local sin desfase de zona horaria. */
export function parseFechaISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Convierte un Date a ISO yyyy-mm-dd usando la fecha local. */
export function toFechaISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseFechaISO(iso))
}
