"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

type Tag = { id: string; name: string; color: string; _count: { photoTags: number } }

export function TagManager({ tags }: { tags: Tag[] }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6B7280")
  const router = useRouter()

  async function create() {
    if (!name.trim()) return
    await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) })
    setName("")
    router.refresh()
  }
  async function remove(id: string) {
    await fetch(`/api/tags/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag name" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded border border-gray-300" />
        <button onClick={create} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {tags.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No tags yet.</div> : tags.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="flex-1 text-sm text-gray-900">{t.name}</span>
            <span className="text-xs text-gray-400">{t._count.photoTags} photos</span>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
