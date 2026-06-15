"use client"

import { useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

type CT = { id: string; name: string; updatedAt: Date | string; _count: { items: number } }
type RT = { id: string; name: string; updatedAt: Date | string }
type PT = { id: string; name: string; updatedAt: Date | string }

export function TemplatesHub({ checklistTemplates, reportTemplates, pageTemplates }: { checklistTemplates: CT[]; reportTemplates: RT[]; pageTemplates: PT[] }) {
  const [tab, setTab] = useState<"Checklists" | "Reports" | "Pages">("Checklists")
  const tabs = ["Checklists", "Reports", "Pages"] as const

  const rows =
    tab === "Checklists"
      ? checklistTemplates.map((t) => ({ id: t.id, name: t.name, meta: `${t._count.items} items`, updatedAt: t.updatedAt }))
      : tab === "Reports"
        ? reportTemplates.map((t) => ({ id: t.id, name: t.name, meta: "", updatedAt: t.updatedAt }))
        : pageTemplates.map((t) => ({ id: t.id, name: t.name, meta: "", updatedAt: t.updatedAt }))

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No {tab.toLowerCase()} templates yet.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="flex-1 font-medium text-gray-900">{r.name}</span>
              {r.meta && <span className="text-xs text-gray-400">{r.meta}</span>}
              <span className="text-xs text-gray-400">{formatRelativeTime(r.updatedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
