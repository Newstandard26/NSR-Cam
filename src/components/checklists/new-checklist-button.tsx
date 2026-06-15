"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

type Opt = { id: string; name: string | null }

export function NewChecklistButton() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Opt[]>([])
  const [templates, setTemplates] = useState<Opt[]>([])
  const [form, setForm] = useState({ name: "", projectId: "", templateId: "" })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(Array.isArray(d) ? d : []))
    fetch("/api/checklist_templates").then((r) => r.json()).then((d) => setTemplates(Array.isArray(d) ? d : []))
  }, [open])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.projectId) return
    setSaving(true)
    const res = await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        projectId: form.projectId,
        templateId: form.templateId || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: "", projectId: "", templateId: "" })
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1">
        <Plus className="w-4 h-4" /> New Checklist
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Checklist</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={create} className="space-y-3">
              <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light">
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light">
                <option value="">No template (blank)</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input placeholder="Checklist name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light" />
              <button type="submit" disabled={saving} className="w-full bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50">
                {saving ? "Creating..." : "Create Checklist"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
