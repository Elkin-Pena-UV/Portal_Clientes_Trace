'use client'

import { ShieldAlert } from 'lucide-react'
import type { Rol } from '@/lib/types'
import { usePortal } from '@/components/portal-provider'

const ROL_NOMBRE: Record<Rol, string> = {
  cliente: 'Cliente',
  servicio: 'Servicio al Cliente',
  admin: 'Admin',
}

interface RoleGuardProps {
  /** Rol que puede ver el contenido envuelto. */
  rol: Rol
  children: React.ReactNode
}

/**
 * Guard de prototipo: renderiza el contenido solo si el rol activo del
 * provider coincide. No es autorización real — el rol viene del switcher
 * de desarrollo del sidebar.
 */
export function RoleGuard({ rol, children }: RoleGuardProps) {
  const { rol: rolActivo } = usePortal()

  if (rolActivo !== rol) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Sin acceso</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta sección es exclusiva del rol {ROL_NOMBRE[rol]}. Tu rol actual es{' '}
          {ROL_NOMBRE[rolActivo]}; cámbialo con el selector del menú lateral
          para probarla.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
