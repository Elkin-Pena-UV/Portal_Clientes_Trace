import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ModulePlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-gray-100">
            <Icon className="size-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 max-w-md">{description}</p>
      </div>
    </div>
  )
}
