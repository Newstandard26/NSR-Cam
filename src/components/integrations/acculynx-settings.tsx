"use client"

import { useState } from "react"
import { Plug, Check, RefreshCw, Copy } from "lucide-react"

type Props = {
  initial: { enabled: boolean; baseUrl: string; hasApiKey: boolean }
  syncedProjects: number
  lastEventAt: string | null
}

export function AccuLynxSettings({ initial, syncedProjects, lastEventAt }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [hasApiKey, setHasApiKey] = useState(initial.hasApiKey)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/integrations/acculynx/webhook`
      : "/api/integrations/acculynx/webhook"

  async function save() {
    setSaving(true)
    setMsg(null)
    const res = await fetch("/api/integrations/acculynx/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, apiKey: apiKey || undefined, baseUrl }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      setHasApiKey(data.hasApiKey)
      setApiKey("")
      setMsg("Settings saved.")
    } else {
      setMsg("Failed to save settings.")
    }
  }

  async function runSync() {
    setSyncing(true)
    setMsg(null)
    const res = await fetch("/api/integrations/acculynx/sync", { method: "POST" })
    setSyncing(false)
    if (res.ok) {
      const data = await res.json()
      setMsg(`Synced ${data.synced} job(s) from AccuLynx.`)
    } else {
      const data = await res.json().catch(() => ({}))
      setMsg(data.error || "Sync failed.")
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Plug className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AccuLynx</h2>
            <p className="text-sm text-gray-500">
              Sync jobs → projects, map statuses to labels, push photos back to jobs.
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            enabled && hasApiKey
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {enabled && hasApiKey ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-gray-300"
          />
          Enable AccuLynx integration
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key {hasApiKey && <span className="text-green-600">(set)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? "•••••••• (leave blank to keep)" : "Paste AccuLynx API key"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Base URL (optional)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.acculynx.com/api/v2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL (paste this into AccuLynx)
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
            />
            <button
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={runSync}
          disabled={syncing || !enabled}
          className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync now"}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>

      <div className="mt-4 flex gap-6 text-xs text-gray-500">
        <span>{syncedProjects} project(s) linked</span>
        <span>
          Last event:{" "}
          {lastEventAt ? new Date(lastEventAt).toLocaleString() : "none yet"}
        </span>
      </div>
    </div>
  )
}
