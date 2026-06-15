"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Camera } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { BrandMark } from "@/components/brand"

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-gray-900 text-white px-3 py-2.5 shrink-0">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
          <BrandMark size="sm" />
          <Link href="/camera" className="ml-auto bg-brand rounded-full p-2" aria-label="Camera">
            <Camera className="w-5 h-5" />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
