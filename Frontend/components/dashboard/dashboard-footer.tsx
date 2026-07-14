import { MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export function DashboardFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 mt-auto mt-16">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Cementos San Marcos S.A.S.
          </h3>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Km 24 Vía Panorama Cali – Buga, Corregimiento San Marcos ·
              Yumbo, Valle del Cauca
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <p>PBX +57 (2) 475.0010 · NIT 900.155.107-1</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex flex-wrap justify-start gap-4 text-sm md:justify-end">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              Política de privacidad
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              Términos de uso
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Cementos San Marcos S.A.S. — Todos los derechos
            reservados
          </p>
        </div>
      </div>
    </footer>
  )
}
