"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SwitchCamera, Zap, ZapOff, ImageIcon, Check, Loader2, X, Tag } from "lucide-react"

type Project = { id: string; name: string }
type Pending = { blob: Blob; dataUrl: string }

const MODES = ["SCAN", "WALKTHRU", "PHOTO", "VIDEO", "DUAL"] as const

export function CameraCapture({
  lockedProjectId,
  lockedProjectName,
}: {
  lockedProjectId?: string
  lockedProjectName?: string
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(lockedProjectId ?? "")
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [zoom, setZoom] = useState(1)
  const [flash, setFlash] = useState(false)
  const [mode, setMode] = useState<(typeof MODES)[number]>("PHOTO")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [captured, setCaptured] = useState(0)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [description, setDescription] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [lastThumb, setLastThumb] = useState<string | null>(null)
  const [showTagSheet, setShowTagSheet] = useState(false)
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [sessionTags, setSessionTags] = useState<string[]>([]) // tag ids applied to every capture

  useEffect(() => {
    if (!lockedProjectId) {
      fetch("/api/projects").then((r) => r.json()).then((d) => {
        const list = Array.isArray(d) ? d : []
        setProjects(list)
        if (list[0]) setProjectId(list[0].id)
      })
    }
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    )
  }, [lockedProjectId])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setStreaming(true)
    } catch {
      setError("Camera permission required. Use the upload button instead.")
      setStreaming(false)
    }
  }, [facing])

  useEffect(() => {
    startCamera()
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [startCamera])

  // Apply zoom: native track zoom if supported, CSS scale fallback.
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track?.applyConstraints({ advanced: [{ zoom } as any] }).catch(() => {})
    if (videoRef.current) videoRef.current.style.transform = `scale(${zoom})`
  }, [zoom, streaming])

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks()[0]
    const next = !flash
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track?.applyConstraints({ advanced: [{ torch: next } as any] })
    } catch {}
    setFlash(next)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function openTagSheet() {
    if (allTags.length === 0) {
      fetch("/api/tags").then((r) => r.json()).then((d) => setAllTags(Array.isArray(d) ? d : []))
    }
    setShowTagSheet(true)
  }
  function toggleSessionTag(id: string) {
    setSessionTags((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function capture() {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5)
        setPending({ blob, dataUrl })
        setLastThumb(dataUrl)
      }
    }, "image/jpeg", 0.92)
  }

  async function confirmUpload() {
    if (!pending || !projectId) { setError("Select a project first."); return }
    setUploading(true)
    const fd = new FormData()
    fd.append("photo", pending.blob, `capture-${Date.now()}.jpg`)
    fd.append("project_id", projectId)
    if (description) fd.append("description", description)
    if (coords) { fd.append("lat", String(coords.lat)); fd.append("lng", String(coords.lng)) }
    const res = await fetch("/api/photos", { method: "POST", body: fd })
    if (res.ok) {
      // Apply session tags to the new photo
      if (sessionTags.length) {
        const photo = await res.json()
        await fetch(`/api/photos/${photo.id}/tags`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds: sessionTags }),
        }).catch(() => {})
      }
      setCaptured((c) => c + 1); setPending(null); setDescription("")
    } else setError("Upload failed. Try again.")
    setUploading(false)
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPending({ blob: file, dataUrl: reader.result as string })
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  function done() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (lockedProjectId) router.push(`/projects/${lockedProjectId}?uploaded=true`)
    else router.push("/projects")
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 text-white">
        {lockedProjectId ? (
          <span className="text-sm truncate"><span className="text-gray-400">Saving to:</span> {lockedProjectName ?? "project"}</span>
        ) : (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 text-sm max-w-[55%]">
            <option value="">Select project…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={openTagSheet} className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center" title="Tag photos">
            <Tag className="w-5 h-5" />
            {sessionTags.length > 0 && <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{sessionTags.length}</span>}
          </button>
          <button onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center" title="Flip"><SwitchCamera className="w-5 h-5" /></button>
          <button onClick={toggleFlash} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center" title="Flash">{flash ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5" />}</button>
          <button onClick={done} className="text-sm font-medium bg-white/10 px-3 h-9 rounded-full">Done{captured > 0 ? ` (${captured})` : ""}</button>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-transform" />
        <canvas ref={canvasRef} className="hidden" />
        {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-300 bg-black/70">{error}</div>}
        {coords && <div className="absolute top-2 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">GPS on</div>}
        {toast && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">{toast}</div>}

        {/* Last-captured thumbnail */}
        {lastThumb && !pending && (
          <div className="absolute bottom-3 left-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastThumb} alt="Last capture" className="w-14 h-14 rounded-xl object-cover border-2 border-white" />
              {captured > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{captured}</span>
              )}
            </div>
          </div>
        )}

        {/* Zoom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0.5, 1, 4].map((z) => (
            <button key={z} onClick={() => setZoom(z)} className={`px-3 py-1 rounded-full text-xs font-medium ${zoom === z ? "bg-brand text-white" : "bg-black/50 text-white"}`}>{z}x</button>
          ))}
        </div>

        {/* Post-capture description prompt */}
        {pending && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.dataUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmUpload()} placeholder="Add description…" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light" />
            <button onClick={() => { setPending(null); setDescription("") }} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
            <button onClick={confirmUpload} disabled={uploading} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Done
            </button>
          </div>
        )}
      </div>

      {/* Shutter row */}
      <div className="bg-black px-4 py-4 flex items-center justify-between">
        <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"><ImageIcon className="w-5 h-5" /></button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFilePicked} className="hidden" />
        <button onClick={streaming ? capture : startCamera} disabled={uploading || !projectId} className="rounded-full bg-white ring-4 ring-white/30 disabled:opacity-40" style={{ width: 72, height: 72 }} title="Capture" />
        <div className="w-12 h-12" />
      </div>

      {/* Mode tabs */}
      <div className="bg-black flex items-center justify-center gap-4 pb-6 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => (m === "PHOTO" || m === "VIDEO" ? setMode(m) : showToast(`${m} — coming soon`))}
            className={`text-xs font-semibold tracking-wide whitespace-nowrap ${mode === m ? "text-brand-light" : "text-gray-400"}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Tag sheet */}
      {showTagSheet && (
        <div className="absolute inset-0 z-[60] flex items-end" onClick={() => setShowTagSheet(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Tag photos this session</span>
              <button onClick={() => setShowTagSheet(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Selected tags are applied to every photo you take until you close the camera.</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => {
                const on = sessionTags.includes(t.id)
                return (
                  <button key={t.id} onClick={() => toggleSessionTag(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${on ? "border-brand bg-sky-50 text-brand" : "border-gray-300 text-gray-700"}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                )
              })}
              {allTags.length === 0 && <p className="text-sm text-gray-400">No tags yet. Create them under Tags.</p>}
            </div>
            <button onClick={() => setShowTagSheet(false)} className="mt-4 w-full bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
