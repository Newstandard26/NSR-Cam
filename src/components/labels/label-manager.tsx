"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

type Label = { id: string; name: string; color: string; _count: { projects: number } }

export function LabelManager({ labels }: { labels: Label[] }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#22C55E")
  const router = useRouter()

  async function create() {
    if (!name.trim()) return
    await fetch("/api/labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) })
    setName("")
    router.refresh()
  }
  async function remove(id: string) {
    await fetch(`/api/labels/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New label name" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded border border-gray-300" />
        <button onClick={create} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {labels.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No labels yet.</div> : labels.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: l.color + "22", color: l.color }}>{l.name}</span>
            <span className="flex-1" />
            <span className="text-xs text-gray-400">{l._count.projects} projects</span>
            <button onClick={() => remove(l.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
