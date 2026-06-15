"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  X, ChevronLeft, ChevronRight, Download, Trash2, Pencil, MapPin, Plus, Tag as TagIcon,
} from "lucide-react"
import { Avatar, LabelBadge } from "@/components/ui/badges"
import { AnnotationEditor } from "./annotation-editor"
import { SelectTagsModal } from "./select-tags-modal"

type Basic = { id: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullPhoto = any

export function PhotoModal({
  photos,
  initialIndex,
  onClose,
  onChanged,
}: {
  photos: Basic[]
  initialIndex: number
  onClose: () => void
  onChanged?: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [photo, setPhoto] = useState<FullPhoto | null>(null)
  const [editing, setEditing] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [descEditing, setDescEditing] = useState(false)
  const [desc, setDesc] = useState("")
  const [comment, setComment] = useState("")
  const [newTask, setNewTask] = useState("")
  const [showTaskInput, setShowTaskInput] = useState(false)

  const id = photos[index]?.id

  const load = useCallback(() => {
    if (!id) return
    fetch(`/api/photos/${id}`).then((r) => r.json()).then((p) => { setPhoto(p); setDesc(p.description ?? "") })
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editing || tagsOpen) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" && index < photos.length - 1) setIndex((i) => i + 1)
      if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, photos.length, onClose, editing, tagsOpen])

  async function saveDesc() {
    setDescEditing(false)
    await fetch(`/api/photos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: desc }) })
    onChanged?.()
  }
  async function postComment() {
    if (!comment.trim()) return
    await fetch(`/api/photos/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) })
    setComment(""); load()
  }
  async function addTask() {
    if (!newTask.trim()) return
    await fetch(`/api/photos/${id}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newTask }) })
    setNewTask(""); setShowTaskInput(false); load()
  }
  async function toggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/photos/${id}/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) })
    load()
  }
  async function trash() {
    if (!confirm("Move this photo to trash?")) return
    await fetch(`/api/photos/${id}`, { method: "DELETE" })
    onChanged?.(); onClose()
  }

  if (!photo) {
    return <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center text-gray-300 text-sm">Loading…</div>
  }

  const addr = [photo.project?.street1, photo.project?.city, photo.project?.state].filter(Boolean).join(", ")

  return (
    <>
      <div className="fixed inset-0 bg-black/85 z-50 flex flex-col">
        {/* Top toolbar */}
        <div className="flex items-center gap-2 p-3 text-white">
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 bg-brand px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-dark">
            <Pencil className="w-4 h-4" /> Edit Photo
          </button>
          <a href={photo.uri} download className="p-2 rounded-lg hover:bg-white/10"><Download className="w-5 h-5" /></a>
          <button onClick={trash} className="p-2 rounded-lg hover:bg-white/10"><Trash2 className="w-5 h-5" /></button>
          <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/10"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Image */}
          <div className="flex-1 relative flex items-center justify-center">
            {index > 0 && (
              <button onClick={() => setIndex(index - 1)} className="absolute left-3 text-white/80 hover:text-white"><ChevronLeft className="w-9 h-9" /></button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.uri} alt={photo.description ?? ""} className="max-h-full max-w-full object-contain" />
            {index < photos.length - 1 && (
              <button onClick={() => setIndex(index + 1)} className="absolute right-3 text-white/80 hover:text-white"><ChevronRight className="w-9 h-9" /></button>
            )}
          </div>

          {/* Right panel */}
          <div className="w-[360px] bg-white overflow-y-auto p-4 space-y-4 hidden md:block">
            <div>
              <Link href={`/projects/${photo.project?.id}`} className="font-semibold text-gray-900 hover:underline">{photo.project?.name}</Link>
              {addr && <p className="text-xs text-gray-500">{addr}</p>}
            </div>
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              {photo.user && <Avatar name={photo.user.name || "?"} color={photo.user.color} />}
              <div className="flex-1">
                <p className="text-sm text-gray-800">{photo.user?.name ?? "Unknown"}</p>
                <p className="text-xs text-gray-400">{new Date(photo.capturedAt).toLocaleString()}</p>
              </div>
              {photo.lat && photo.lng && (
                <a href={`https://www.google.com/maps/place/${photo.lat},${photo.lng}`} target="_blank" rel="noreferrer" title="Open location" className="text-brand"><MapPin className="w-5 h-5" /></a>
              )}
            </div>

            {/* Tags */}
            <div className="border-t border-gray-100 pt-3">
              <button onClick={() => setTagsOpen(true)} className="flex items-center gap-1 text-sm text-brand font-medium">
                <TagIcon className="w-4 h-4" /> Add Tags
              </button>
              <div className="flex flex-wrap gap-1 mt-2">
                {photo.tags?.map((t: any) => <LabelBadge key={t.tag.id} name={t.tag.name} color={t.tag.color} />)}
              </div>
            </div>

            {/* Tasks */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tasks</span>
                <button onClick={() => setShowTaskInput((v) => !v)} className="text-sm text-brand flex items-center gap-1"><Plus className="w-3 h-3" /> New Task</button>
              </div>
              {showTaskInput && (
                <div className="flex gap-2 mt-2">
                  <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Task…" className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                  <button onClick={addTask} className="text-sm bg-brand text-white px-2 rounded-lg">Add</button>
                </div>
              )}
              <ul className="mt-2 space-y-1">
                {photo.tasks?.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={t.completed} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                    <span className={t.completed ? "line-through text-gray-400" : "text-gray-700"}>{t.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Description</span>
                {!descEditing && <button onClick={() => setDescEditing(true)} className="text-sm text-brand">Edit</button>}
              </div>
              {descEditing ? (
                <textarea autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={saveDesc} rows={3} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-1" />
              ) : (
                <button onClick={() => setDescEditing(true)} className="text-sm text-gray-500 mt-1 text-left w-full">{desc || "Add a description…"}</button>
              )}
            </div>

            {/* Comments */}
            <div className="border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-700">Comments</span>
              <div className="space-y-2 mt-2">
                {photo.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar name={c.user?.name || "?"} color={c.user?.color} />
                    <div className="flex-1">
                      <p className="text-xs"><span className="font-medium text-gray-800">{c.user?.name}</span> <span className="text-gray-400">{new Date(c.createdAt).toLocaleString()}</span></p>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postComment()} placeholder="Add a comment…" className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                <button onClick={postComment} className="text-sm bg-brand text-white px-3 rounded-lg">Post</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <AnnotationEditor
          photoUrl={photo.uri}
          photoId={photo.id}
          existingAnnotations={photo.annotations}
          brightness={photo.brightness ?? 0}
          contrast={photo.contrast ?? 0}
          saturation={photo.saturation ?? 0}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); onChanged?.() }}
        />
      )}
      {tagsOpen && (
        <SelectTagsModal
          photoId={photo.id}
          currentTagIds={photo.tags?.map((t: any) => t.tag.id) ?? []}
          onClose={() => setTagsOpen(false)}
          onSaved={() => { load(); onChanged?.() }}
        />
      )}
    </>
  )
}
