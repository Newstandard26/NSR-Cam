"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Tag, Share2, Camera, ArrowLeftRight, EyeOff, Copy, FolderInput, Download, Image as ImageIcon, FileText, X,
} from "lucide-react"

type Props = {
  photoId: string
  projectId: string
  uri: string
  onClose: () => void
  onOpenTags: () => void
  onChanged: () => void
}

export function PhotoContextMenu({ photoId, projectId, uri, onClose, onOpenTags, onChanged }: Props) {
  const router = useRouter()
  const [moving, setMoving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (moving) fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(Array.isArray(d) ? d : []))
  }, [moving])

  async function put(body: object) {
    setBusy(true)
    await fetch(`/api/photos/${photoId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    setBusy(false)
    onChanged()
  }

  async function share() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((navigator as any).share) await (navigator as any).share({ title: "NSR Snapshot Photo", url: uri })
      else { await navigator.clipboard.writeText(uri); alert("Photo link copied") }
    } catch {}
    onClose()
  }
  function saveToDevice() {
    const a = document.createElement("a"); a.href = uri; a.download = "photo.jpg"; a.target = "_blank"; a.click(); onClose()
  }
  async function duplicate() {
    setBusy(true); await fetch(`/api/photos/${photoId}/duplicate`, { method: "POST" }); setBusy(false); onChanged(); onClose()
  }
  async function setCover() {
    await fetch(`/api/projects/${projectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coverPhotoUrl: uri }) })
    onClose()
  }
  async function createReport() {
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, photoIds: [photoId] }) })
    if (res.ok) router.push("/reports")
    onClose()
  }
  async function moveTo(newId: string) {
    await put({ projectId: newId }); onClose()
  }

  const actions = [
    { id: "tag", icon: Tag, label: "Tag", run: () => { onOpenTags(); onClose() } },
    { id: "share", icon: Share2, label: "Share", run: share },
    { id: "take-after", icon: Camera, label: "Take After Photo", run: () => { router.push(`/camera?project=${projectId}`); onClose() } },
    { id: "choose-after", icon: ArrowLeftRight, label: "Choose After Photo", run: () => alert("Before/after pairing — coming soon") },
    { id: "hide", icon: EyeOff, label: "Hide in Project Timeline", run: () => put({ hiddenFromTimeline: true }).then(onClose) },
    { id: "duplicate", icon: Copy, label: "Duplicate", run: duplicate },
    { id: "move", icon: FolderInput, label: "Move to Project", run: () => setMoving(true) },
    { id: "save", icon: Download, label: "Save to Device", run: saveToDevice },
    { id: "cover", icon: ImageIcon, label: "Set as Cover Photo", run: setCover },
    { id: "report", icon: FileText, label: "Create Report", run: createReport },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-2"><div className="w-10 h-1.5 rounded-full bg-gray-300" /></div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-semibold text-gray-900">Photo actions</span>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {moving ? (
          <div className="px-2 pb-4">
            <p className="px-2 py-1 text-xs text-gray-500">Move to which project?</p>
            {projects.map((p) => (
              <button key={p.id} onClick={() => moveTo(p.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg">{p.name}</button>
            ))}
          </div>
        ) : (
          <div className="pb-4">
            {actions.map((a) => {
              const Icon = a.icon
              return (
                <button key={a.id} onClick={a.run} disabled={busy} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                  <Icon className="w-5 h-5 text-gray-500" /> {a.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
