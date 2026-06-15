"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Trash2, Pencil, GripVertical } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

type CT = {
  id: string
  name: string
  description: string | null
  updatedAt: Date | string
  items: { id: string; label: string }[]
  _count: { items: number }
}
type RT = { id: string; name: string; description: string | null; updatedAt: Date | string }
type PT = { id: string; name: string; content: string | null; updatedAt: Date | string }

type Tab = "Checklists" | "Reports" | "Pages"
const TABS: Tab[] = ["Checklists", "Reports", "Pages"]

export function TemplatesHub({
  checklistTemplates,
  reportTemplates,
  pageTemplates,
}: {
  checklistTemplates: CT[]
  reportTemplates: RT[]
  pageTemplates: PT[]
}) {
  const [tab, setTab] = useState<Tab>("Checklists")
  const router = useRouter()

  // editor state — `editing` holds the record being edited, "new", or null
  const [editing, setEditing] = useState<CT | RT | PT | "new" | null>(null)

  async function remove(kind: Tab, id: string) {
    const path =
      kind === "Checklists" ? "checklist_templates" : kind === "Reports" ? "report_templates" : "page_templates"
    await fetch(`/api/${path}/${id}`, { method: "DELETE" })
    router.refresh()
  }

  function closeEditor() {
    setEditing(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing("new")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {tab === "Checklists" && (
        <TemplateTable
          rows={checklistTemplates.map((t) => ({ id: t.id, name: t.name, meta: `${t._count.items} items`, updatedAt: t.updatedAt }))}
          onEdit={(id) => setEditing(checklistTemplates.find((t) => t.id === id)!)}
          onDelete={(id) => remove("Checklists", id)}
          empty="No checklist templates yet."
        />
      )}
      {tab === "Reports" && (
        <TemplateTable
          rows={reportTemplates.map((t) => ({ id: t.id, name: t.name, meta: t.description ?? "", updatedAt: t.updatedAt }))}
          onEdit={(id) => setEditing(reportTemplates.find((t) => t.id === id)!)}
          onDelete={(id) => remove("Reports", id)}
          empty="No report templates yet."
        />
      )}
      {tab === "Pages" && (
        <TemplateTable
          rows={pageTemplates.map((t) => ({ id: t.id, name: t.name, meta: "", updatedAt: t.updatedAt }))}
          onEdit={(id) => setEditing(pageTemplates.find((t) => t.id === id)!)}
          onDelete={(id) => remove("Pages", id)}
          empty="No page templates yet."
        />
      )}

      {editing !== null && tab === "Checklists" && (
        <ChecklistTemplateEditor record={editing === "new" ? null : (editing as CT)} onClose={closeEditor} />
      )}
      {editing !== null && tab === "Reports" && (
        <ReportTemplateEditor record={editing === "new" ? null : (editing as RT)} onClose={closeEditor} />
      )}
      {editing !== null && tab === "Pages" && (
        <PageTemplateEditor record={editing === "new" ? null : (editing as PT)} onClose={closeEditor} />
      )}
    </div>
  )
}

function TemplateTable({
  rows,
  onEdit,
  onDelete,
  empty,
}: {
  rows: { id: string; name: string; meta: string; updatedAt: Date | string }[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  empty: string
}) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">{empty}</div>
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
          <span className="flex-1 font-medium text-gray-900">{r.name}</span>
          {r.meta && <span className="text-xs text-gray-400">{r.meta}</span>}
          <span className="text-xs text-gray-400 w-24 text-right">{formatRelativeTime(r.updatedAt)}</span>
          <button onClick={() => onEdit(r.id)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => onDelete(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ChecklistTemplateEditor({ record, onClose }: { record: CT | null; onClose: () => void }) {
  const [name, setName] = useState(record?.name ?? "")
  const [description, setDescription] = useState(record?.description ?? "")
  const [items, setItems] = useState<string[]>(record?.items.map((i) => i.label) ?? [""])
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { name, description, items: items.map((i) => i.trim()).filter(Boolean) }
    const url = record ? `/api/checklist_templates/${record.id}` : "/api/checklist_templates"
    await fetch(url, { method: record ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={record ? "Edit Checklist Template" : "New Checklist Template"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <input required placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-gray-400">Items</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
              <input value={item} onChange={(e) => setItems(items.map((it, i) => (i === idx ? e.target.value : it)))} placeholder={`Item ${idx + 1}`} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, ""])} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Template"}</button>
      </form>
    </Modal>
  )
}

function ReportTemplateEditor({ record, onClose }: { record: RT | null; onClose: () => void }) {
  const [name, setName] = useState(record?.name ?? "")
  const [description, setDescription] = useState(record?.description ?? "")
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = record ? `/api/report_templates/${record.id}` : "/api/report_templates"
    await fetch(url, { method: record ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={record ? "Edit Report Template" : "New Report Template"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <input required placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <textarea placeholder="Description / layout notes" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Template"}</button>
      </form>
    </Modal>
  )
}

function PageTemplateEditor({ record, onClose }: { record: PT | null; onClose: () => void }) {
  const [name, setName] = useState(record?.name ?? "")
  const [content, setContent] = useState(record?.content ?? "")
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = record ? `/api/page_templates/${record.id}` : "/api/page_templates"
    await fetch(url, { method: record ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content }) })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={record ? "Edit Page Template" : "New Page Template"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <input required placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <textarea placeholder="Page content / boilerplate" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Template"}</button>
      </form>
    </Modal>
  )
}
