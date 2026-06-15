"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

type Webhook = { id: string; url: string; events: string[]; active: boolean }

const EVENT_TYPES = ["photo.created", "project.created", "project.updated", "checklist.completed", "video.updated"]

export function WebhookManager({ webhooks }: { webhooks: Webhook[] }) {
  const [url, setUrl] = useState("")
  const [events, setEvents] = useState<string[]>([])
  const router = useRouter()

  async function create() {
    if (!url.trim() || events.length === 0) return
    await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, events }) })
    setUrl("")
    setEvents([])
    router.refresh()
  }
  async function remove(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-endpoint.com/webhook" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-light" />
        <div className="flex flex-wrap gap-2 mb-3">
          {EVENT_TYPES.map((ev) => (
            <label key={ev} className="flex items-center gap-1 text-xs border border-gray-200 rounded-full px-2 py-1 cursor-pointer">
              <input type="checkbox" checked={events.includes(ev)} onChange={(e) => setEvents(e.target.checked ? [...events, ev] : events.filter((x) => x !== ev))} />
              {ev}
            </label>
          ))}
        </div>
        <button onClick={create} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-1"><Plus className="w-4 h-4" /> Add Webhook</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {webhooks.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No webhooks yet.</div> : webhooks.map((w) => (
          <div key={w.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{w.url}</p>
              <p className="text-xs text-gray-400">{w.events.join(", ")}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${w.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{w.active ? "Active" : "Off"}</span>
            <button onClick={() => remove(w.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
