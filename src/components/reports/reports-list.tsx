"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Plus, X, Download, Loader2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

type Report = {
  id: string
  name: string
  createdAt: Date | string
  pdfUri: string | null
  project: { id: string; name: string }
}

export function ReportsList({ reports }: { reports: Report[] }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ name: "", projectId: "" })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(Array.isArray(d) ? d : []))
  }, [open])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.projectId) return
    setSaving(true)
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name || undefined, projectId: form.projectId }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: "", projectId: "" })
      router.refresh()
    }
  }

  async function generate(id: string) {
    setGenerating(id)
    const res = await fetch(`/api/reports/${id}/generate-pdf`, { method: "POST" })
    setGenerating(null)
    if (res.ok) {
      const { pdfUri } = await res.json()
      router.refresh()
      if (pdfUri) window.open(pdfUri, "_blank")
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No reports yet. Create one from a project&apos;s photos.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{r.name}</p>
                <Link href={`/projects/${r.project.id}`} className="text-xs text-blue-600 hover:underline">{r.project.name}</Link>
              </div>
              <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
              {r.pdfUri ? (
                <a href={r.pdfUri} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Download className="w-4 h-4" /> PDF
                </a>
              ) : (
                <button onClick={() => generate(r.id)} disabled={generating === r.id} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50">
                  {generating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {generating === r.id ? "Generating..." : "Generate PDF"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Report</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={create} className="space-y-3">
              <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input placeholder="Report title (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500">All current photos on the project will be included. Generate the PDF after creating.</p>
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Creating..." : "Create Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
