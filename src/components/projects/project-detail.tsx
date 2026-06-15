"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Avatar, LabelBadge } from "@/components/ui/badges"
import { PhotoGrid, type PhotoItem } from "@/components/photos/photo-grid"
import { PhotoUploader } from "@/components/photos/photo-uploader"

type Project = {
  id: string
  name: string
  street1: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  description: string | null
  customer: { id: string; name: string } | null
  labels: { label: { id: string; name: string; color: string } }[]
  users: { user: { id: string; name: string | null; color: string | null } }[]
  collaborators: { id: string; email: string }[]
  tasks: { id: string; title: string; completed: boolean }[]
  _count: { photos: number; documents: number; checklists: number; pages: number }
}

const TABS = ["Photos", "Pages", "Files", "Checklists", "Reports"] as const
type Tab = (typeof TABS)[number]

export function ProjectDetail({ project }: { project: Project }) {
  const [tab, setTab] = useState<Tab>("Photos")
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)

  useEffect(() => {
    if (tab !== "Photos") return
    setLoadingPhotos(true)
    fetch(`/api/photos?project_id=${project.id}`)
      .then((r) => r.json())
      .then((data) => setPhotos(Array.isArray(data) ? data : []))
      .finally(() => setLoadingPhotos(false))
  }, [tab, project.id])

  const address = [project.street1, project.city, project.state, project.postalCode]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex-1 p-6">
        <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
          <Link href="/projects" className="hover:text-gray-600">
            Projects
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700">{project.name}</span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.labels.map((l) => (
            <LabelBadge key={l.label.id} name={l.label.name} color={l.label.color} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-5">{address || "No address"}</p>

        <div className="flex gap-1 border-b border-gray-200 mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
              {t === "Photos" && ` (${project._count.photos})`}
              {t === "Files" && ` (${project._count.documents})`}
              {t === "Checklists" && ` (${project._count.checklists})`}
              {t === "Pages" && ` (${project._count.pages})`}
            </button>
          ))}
        </div>

        {tab === "Photos" && (
          <div className="space-y-4">
            <PhotoUploader projectId={project.id} />
            {loadingPhotos ? (
              <p className="text-sm text-gray-400">Loading photos...</p>
            ) : (
              <PhotoGrid photos={photos} />
            )}
          </div>
        )}
        {tab !== "Photos" && (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
            {tab} — coming soon
          </div>
        )}
      </div>

      <aside className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Customer</h3>
          {project.customer ? (
            <p className="text-sm text-gray-700">{project.customer.name}</p>
          ) : (
            <p className="text-sm text-gray-400">No customer linked</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Project Users</h3>
          <div className="flex flex-wrap gap-1">
            {project.users.length ? (
              project.users.map((u) => (
                <Avatar key={u.user.id} name={u.user.name || "?"} color={u.user.color} />
              ))
            ) : (
              <p className="text-sm text-gray-400">None assigned</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Collaborators</h3>
          {project.collaborators.length ? (
            project.collaborators.map((c) => (
              <p key={c.id} className="text-sm text-gray-700">
                {c.email}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-400">None</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Description</h3>
          <p className="text-sm text-gray-700">
            {project.description || <span className="text-gray-400">No description</span>}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Tasks</h3>
          {project.tasks.length ? (
            <ul className="space-y-1">
              {project.tasks.map((t) => (
                <li key={t.id} className="text-sm text-gray-700 flex items-center gap-2">
                  <input type="checkbox" defaultChecked={t.completed} readOnly />
                  {t.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No tasks</p>
          )}
        </div>
      </aside>
    </div>
  )
}
