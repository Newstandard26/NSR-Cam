"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Copy } from "lucide-react"
import { Avatar } from "@/components/ui/badges"

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  color: string | null
  _count: { projectUsers: number; photos: number }
}

export function TeamTable({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "FIELD" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const router = useRouter()

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setTempPassword(data.tempPassword)
      router.refresh()
    } else {
      setError(data.error || "Failed to invite user")
    }
  }

  function close() {
    setOpen(false)
    setForm({ name: "", email: "", role: "FIELD" })
    setTempPassword(null)
    setError("")
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No team members yet.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium text-right">Projects</th>
                <th className="px-4 py-2 font-medium text-right">Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Avatar name={u.name || "?"} color={u.color} /> <span className="font-medium text-gray-900">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{u.role}</span></td>
                  <td className="px-4 py-3 text-right text-gray-600">{u._count.projectUsers}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{u._count.photos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={close}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invite User</h2>
              <button onClick={close}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {tempPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  User created. Share this temporary password with them — they&apos;ll be
                  required to set a new one on first sign-in.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono">{tempPassword}</code>
                  <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>
                <button onClick={close} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Done</button>
              </div>
            ) : (
              <form onSubmit={invite} className="space-y-3">
                <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="FIELD">Field</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Inviting..." : "Send Invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
