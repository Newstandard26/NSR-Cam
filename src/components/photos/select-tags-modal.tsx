"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

type Tag = { id: string; name: string; color: string }

export function SelectTagsModal({
  photoId,
  currentTagIds,
  onClose,
  onSaved,
}: {
  photoId: string
  currentTagIds: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [tags, setTags] = useState<Tag[]>([])
  const [selected, setSelected] = useState<string[]>(currentTagIds)
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(Array.isArray(d) ? d : []))
  }, [])

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
  const exactExists = tags.some((t) => t.name.toLowerCase() === query.toLowerCase().trim())

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function createTag() {
    const name = query.trim()
    if (!name) return
    const res = await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    if (res.ok) {
      const tag = await res.json()
      setTags((t) => [...t, tag])
      setSelected((s) => [...s, tag.id])
      setQuery("")
    }
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/photos/${photoId}/tags`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagIds: selected }) })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Select Tags</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find tags or create them..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
        <div className="max-h-60 overflow-y-auto space-y-1 mb-3">
          {query.trim() && !exactExists && (
            <button onClick={createTag} className="w-full text-left px-3 py-2 rounded-lg text-sm text-brand hover:bg-sky-50">
              Create “{query.trim()}”
            </button>
          )}
          {filtered.map((t) => (
            <button key={t.id} onClick={() => toggle(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${selected.includes(t.id) ? "bg-sky-50" : "hover:bg-gray-50"}`}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="flex-1 text-left">{t.name}</span>
              {selected.includes(t.id) && <span className="text-brand text-xs">Selected</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <Link href="/tags" className="text-sm text-gray-500 hover:underline">Manage Your Company&apos;s Tags</Link>
          <button onClick={save} disabled={saving} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50">
            {saving ? "Saving..." : "Save Tags"}
          </button>
        </div>
      </div>
    </div>
  )
}
