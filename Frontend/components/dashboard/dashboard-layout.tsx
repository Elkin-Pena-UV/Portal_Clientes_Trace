'use client'

import React from 'react'
import { Bell, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DashboardFooter } from './dashboard-footer'
import { SidebarMobileContent } from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  ctaButton?: React.ReactNode
  hasFixedBottomBar?: boolean
  hideFooter?: boolean
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  ctaButton,
  hasFixedBottomBar = false,
  hideFooter = false,
}: DashboardLayoutProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)

  return (
    <div className="flex flex-col min-h-full w-full">
      {/* Sheet for mobile drawer — placed outside header */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-56 p-0 flex flex-col" showCloseButton={false}>
          <SidebarMobileContent onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Header — Single row on mobile, Sticky */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        {/* Mobile: Single row with hamburger, title, action, and bell */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 h-14">
          {/* Left: Hamburger + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="size-5 text-gray-700" />
            </button>
            <h1 className="text-sm font-bold text-gray-900 truncate">
              {title}
            </h1>
          </div>

          {/* Right: Action button + Bell */}
          <div className="flex items-center gap-2 shrink-0">
            {ctaButton && ctaButton}
            <button className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 relative" aria-label="Notifications">
              <Bell className="size-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6600] rounded-full" />
            </button>
          </div>
        </div>

        {/* Desktop: Full width with title, subtitle, and actions */}
        <div className="hidden md:block px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {ctaButton && ctaButton}
              <button className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 relative" aria-label="Notifications">
                <Bell className="size-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6600] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — flex-1 pushes footer down, overflow-auto allows scroll */}
      <main className={`flex-1 overflow-auto px-4 md:px-6 py-4 md:py-6 w-full flex flex-col ${hasFixedBottomBar ? 'pb-32' : ''}`} style={{ paddingTop: 0 }}>
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Global Footer — Only show if not hidden, positioned naturally below main content */}
      {!hideFooter && <DashboardFooter />}
    </div>
  )
}
