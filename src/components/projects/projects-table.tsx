"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Camera, FileText, ClipboardList, StickyNote, Search } from "lucide-react"
import { Avatar, LabelBadge } from "@/components/ui/badges"
import { formatRelativeTime } from "@/lib/utils"

type ProjectRow = {
  id: string
  name: string
  street1: string | null
  city: string | null
  state: string | null
  updatedAt: Date | string
  labels: { label: { id: string; name: string; color: string } }[]
  users: { user: { id: string; name: string | null; color: string | null } }[]
  photos: { id: string; uri: string }[]
  _count: { photos: number; documents: number; checklists: number; pages: number }
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.street1 ?? "").toLowerCase().includes(q)
    )
  }, [projects, query])

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No projects found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <li key={p.id}>
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Link href={`/projects/${p.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{p.name}</span>
                      {p.labels.map((l) => (
                        <LabelBadge key={l.label.id} name={l.label.name} color={l.label.color} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {[p.street1, p.city, p.state].filter(Boolean).join(", ") || "No address"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3" /> {p._count.photos}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {p._count.documents}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> {p._count.checklists}
                      </span>
                      <span className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> {p._count.pages}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex gap-1">
                    {p.photos.slice(0, 4).map((ph) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={ph.id}
                        src={ph.uri}
                        alt=""
                        className="w-12 h-12 rounded object-cover bg-gray-100"
                      />
                    ))}
                    {Array.from({ length: Math.max(0, 4 - p.photos.length) }).map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded bg-gray-100" />
                    ))}
                  </div>

                  <div className="flex -space-x-2">
                    {p.users.slice(0, 3).map((u) => (
                      <Avatar key={u.user.id} name={u.user.name || "?"} color={u.user.color} />
                    ))}
                  </div>

                  <div className="text-xs text-gray-400 w-24 text-right shrink-0">
                    {formatRelativeTime(p.updatedAt)}
                  </div>
                  </Link>
                  <Link
                    href={`/camera?project=${p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    title={`Take photo for ${p.name}`}
                    className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                  >
                    <Camera className="w-5 h-5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
