"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Avatar } from "@/components/ui/badges"
import { formatRelativeTime } from "@/lib/utils"

type Checklist = {
  id: string
  name: string
  updatedAt: Date | string
  project: { id: string; name: string; city: string | null; state: string | null }
  assignees: { user: { id: string; name: string | null; color: string | null } }[]
  items: { id: string; label: string; completions: { id: string }[] }[]
}

export function ChecklistFeed({ checklists }: { checklists: Checklist[] }) {
  const [filter, setFilter] = useState<"all" | "finished" | "unfinished">("all")
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    return checklists
      .map((c) => {
        const total = c.items.length
        const done = c.items.filter((i) => i.completions.length > 0).length
        return { ...c, total, done, finished: total > 0 && done === total }
      })
      .filter((c) => (filter === "all" ? true : filter === "finished" ? c.finished : !c.finished))
      .filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.project.name.toLowerCase().includes(query.toLowerCase()))
  }, [checklists, filter, query])

  function exportCsv() {
    const header = ["checklist_name", "project_name", "assignees", "completed", "total"]
    const lines = rows.map((c) => [c.name, c.project.name, c.assignees.map((a) => a.user.name).join("; "), c.done, c.total].map((v) => `"${String(v ?? "")}"`).join(","))
    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "checklists.csv"
    a.click()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(["all", "finished", "unfinished"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{f}</button>
          ))}
        </div>
        <button onClick={exportCsv} className="ml-auto border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Export CSV</button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No checklists.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{c.name}</p>
                <Link href={`/projects/${c.project.id}`} className="text-xs text-blue-600 hover:underline">{c.project.name}</Link>
              </div>
              <div className="flex -space-x-2">{c.assignees.slice(0, 3).map((a) => <Avatar key={a.user.id} name={a.user.name || "?"} color={a.user.color} />)}</div>
              <div className="w-40">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }} /></div>
                <p className="text-[11px] text-gray-400 mt-1">{c.done}/{c.total} completed</p>
              </div>
              <span className="text-xs text-gray-400 w-24 text-right">{formatRelativeTime(c.updatedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
