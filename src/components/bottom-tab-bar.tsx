"use client"

import Link from "next/link"
import { Plus, Camera, Sparkles } from "lucide-react"

export function BottomTabBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-6 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Link href="/projects?new=1" className="flex flex-col items-center text-gray-500 text-[10px] min-w-[44px] min-h-[44px] justify-center">
        <Plus className="w-6 h-6" /> Add
      </Link>
      <Link href="/camera" className="-mt-6 bg-brand text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg ring-4 ring-white">
        <Camera className="w-7 h-7" />
      </Link>
      <button className="flex flex-col items-center text-gray-400 text-[10px] min-w-[44px] min-h-[44px] justify-center" title="AI features — coming soon">
        <Sparkles className="w-6 h-6" /> AI
      </button>
    </div>
  )
}
