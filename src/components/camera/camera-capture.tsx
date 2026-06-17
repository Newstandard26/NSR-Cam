"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SwitchCamera, Zap, ZapOff, ImageIcon, Check, Loader2, X, Tag } from "lucide-react"

type Project = { id: string; name: string }
type Pending = { blob: Blob; dataUrl: string }
type Mode = "SCAN" | "WALKTHRU" | "PHOTO" | "VIDEO" | "DUAL"
const MODES: Mode[] = ["SCAN", "WALKTHRU", "PHOTO", "VIDEO", "DUAL"]

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
  const [mode, setMode] = useState<Mode>("PHOTO")
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
  const [sessionTags, setSessionTags] = useState<string[]>([])

  // Recording (VIDEO / WALKTHRU)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)

  // SCAN multipage
  const [scannedPages, setScannedPages] = useState<string[]>([])
  const [scanFlash, setScanFlash] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [docName, setDocName] = useState("Scanned Document")

  // DUAL picture-in-picture video
  const backVideoRef = useRef<HTMLVideoElement>(null)
  const frontVideoRef = useRef<HTMLVideoElement>(null)
  const dualCanvasRef = useRef<HTMLCanvasElement>(null)
  const backStreamRef = useRef<MediaStream | null>(null)
  const frontStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [dualReady, setDualReady] = useState(false)

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
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}) }
      setStreaming(true)
    } catch (e) {
      const err = e as DOMException
      if (err.name === "NotAllowedError") setError("Camera permission denied. Allow camera access in your browser settings.")
      else if (err.name === "NotFoundError") setError("No camera found on this device.")
      else if (err.name === "NotReadableError") setError("Camera is in use by another app.")
      else setError("Camera unavailable. Use the upload button instead.")
      setStreaming(false)
    }
  }, [facing])

  useEffect(() => {
    if (mode === "DUAL") return
    startCamera()
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [startCamera, mode])

  // DUAL: run back + front cameras, composite to canvas
  useEffect(() => {
    if (mode !== "DUAL") return
    let raf = 0
    ;(async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        const back = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: true })
        backStreamRef.current = back
        if (backVideoRef.current) { backVideoRef.current.srcObject = back; await backVideoRef.current.play().catch(() => {}) }
        try {
          const front = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
          frontStreamRef.current = front
          if (frontVideoRef.current) { frontVideoRef.current.srcObject = front; await frontVideoRef.current.play().catch(() => {}) }
        } catch { /* single-camera device */ }

        const canvas = dualCanvasRef.current
        if (!canvas) return
        canvas.width = 1280; canvas.height = 720
        const ctx = canvas.getContext("2d")!
        const draw = () => {
          if (backVideoRef.current && backVideoRef.current.readyState >= 2) ctx.drawImage(backVideoRef.current, 0, 0, canvas.width, canvas.height)
          if (frontVideoRef.current && frontStreamRef.current && frontVideoRef.current.readyState >= 2) {
            const size = 200, x = canvas.width - size - 20, y = canvas.height - size - 20
            ctx.save()
            ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip()
            ctx.drawImage(frontVideoRef.current, x, y, size, size)
            ctx.restore()
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 3
            ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.stroke()
          }
          raf = requestAnimationFrame(draw)
          rafRef.current = raf
        }
        draw()
        setDualReady(true)
      } catch {
        setError("Dual camera unavailable on this device.")
      }
    })()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      backStreamRef.current?.getTracks().forEach((t) => t.stop())
      frontStreamRef.current?.getTracks().forEach((t) => t.stop())
      backStreamRef.current = null; frontStreamRef.current = null
      setDualReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track?.applyConstraints({ advanced: [{ zoom } as any] }).catch(() => {})
    if (videoRef.current) videoRef.current.style.transform = `scale(${zoom})`
  }, [zoom, streaming])

  // Reset transient mode state when switching modes
  useEffect(() => {
    setScannedPages([])
    if (mode !== "VIDEO" && mode !== "WALKTHRU" && mode !== "DUAL" && isRecording) stopRecording()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks()[0]
    const next = !flash
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await track?.applyConstraints({ advanced: [{ torch: next } as any] }) } catch {}
    setFlash(next)
  }

  function openTagSheet() {
    if (allTags.length === 0) fetch("/api/tags").then((r) => r.json()).then((d) => setAllTags(Array.isArray(d) ? d : []))
    setShowTagSheet(true)
  }
  function toggleSessionTag(id: string) {
    setSessionTags((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function uploadBlob(blob: Blob, desc: string) {
    if (!projectId) { setError("Select a project first."); return }
    setUploading(true)
    const fd = new FormData()
    fd.append("photo", blob, `capture-${Date.now()}.jpg`)
    fd.append("project_id", projectId)
    if (desc) fd.append("description", desc)
    if (coords) { fd.append("lat", String(coords.lat)); fd.append("lng", String(coords.lng)) }
    const res = await fetch("/api/photos", { method: "POST", body: fd })
    if (res.ok) {
      if (sessionTags.length) {
        const photo = await res.json()
        await fetch(`/api/photos/${photo.id}/tags`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagIds: sessionTags }) }).catch(() => {})
      }
      setCaptured((c) => c + 1)
    } else setError("Upload failed. Try again.")
    setUploading(false)
  }

  function grabFrame(): { blob: Promise<Blob | null>; dataUrl: string } {
    const video = videoRef.current!, canvas = canvasRef.current!
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.5),
      blob: new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.92)),
    }
  }

  async function capture() {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas) return

    if (mode === "SCAN") {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0)
      const frameW = canvas.width * 0.75
      const frameH = Math.min(frameW * (11 / 8.5), canvas.height * 0.9)
      const fx = (canvas.width - frameW) / 2, fy = (canvas.height - frameH) / 2
      const crop = document.createElement("canvas")
      crop.width = frameW; crop.height = frameH
      const cctx = crop.getContext("2d")!
      cctx.filter = "contrast(1.2) brightness(1.05) saturate(0.85)"
      cctx.drawImage(canvas, fx, fy, frameW, frameH, 0, 0, frameW, frameH)
      const pageUrl = crop.toDataURL("image/jpeg", 0.92)
      setScannedPages((p) => [...p, pageUrl])
      setLastThumb(pageUrl)
      setScanFlash(true); setTimeout(() => setScanFlash(false), 180)
      return
    }

    // PHOTO (default): show description card
    const f = grabFrame()
    const blob = await f.blob
    if (blob) { setPending({ blob, dataUrl: f.dataUrl }); setLastThumb(f.dataUrl) }
  }

  async function confirmUpload() {
    if (!pending) return
    await uploadBlob(pending.blob, description)
    setPending(null); setDescription("")
  }

  // ── Recording ──
  function startRecording() {
    let stream: MediaStream | null = streamRef.current
    if (mode === "DUAL") {
      const canvas = dualCanvasRef.current
      if (!canvas || !backStreamRef.current) return
      stream = canvas.captureStream(30)
      const audio = backStreamRef.current.getAudioTracks()[0]
      if (audio) stream.addTrack(audio)
    }
    if (!stream) return
    chunksRef.current = []
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4"
    const rec = new MediaRecorder(stream, { mimeType: mime })
    recorderRef.current = rec
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mime })
      if (projectId) {
        setUploading(true)
        const fd = new FormData()
        fd.append("video", blob, `${mode === "WALKTHRU" ? "walkthru" : "video"}-${Date.now()}.webm`)
        fd.append("project_id", projectId)
        fd.append("duration", String(recSeconds))
        const res = await fetch("/api/videos", { method: "POST", body: fd })
        setUploading(false)
        if (res.ok) { setCaptured((c) => c + 1); showToast("Video saved") }
        else setError("Video upload failed.")
      }
    }
    rec.start(1000)
    setIsRecording(true); setRecSeconds(0)
    timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000)
  }
  function stopRecording() {
    recorderRef.current?.stop()
    setIsRecording(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }
  function fmt(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`
  }

  async function saveScannedPdf() {
    if (!projectId || scannedPages.length === 0) return
    setShowNameModal(false)
    setUploading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight()
      scannedPages.forEach((page, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(page, "JPEG", 0, 0, w, h, undefined, "FAST")
      })
      const pdfBlob = pdf.output("blob")
      const fd = new FormData()
      fd.append("file", pdfBlob, `${docName}.pdf`)
      fd.append("project_id", projectId)
      fd.append("name", docName)
      const res = await fetch("/api/documents", { method: "POST", body: fd })
      setUploading(false)
      if (res.ok) {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        router.push(`/projects/${projectId}?uploaded=true`)
      } else setError("PDF upload failed.")
    } catch {
      setUploading(false); setError("Could not build PDF.")
    }
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { const r = new FileReader(); r.onload = () => setPending({ blob: file, dataUrl: r.result as string }); r.readAsDataURL(file) }
    e.target.value = ""
  }

  function done() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    router.push(lockedProjectId ? `/projects/${lockedProjectId}?uploaded=true` : "/projects?uploaded=true")
  }

  const isVideoMode = mode === "VIDEO" || mode === "WALKTHRU" || mode === "DUAL"

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 text-white">
        {lockedProjectId ? (
          <span className="text-sm truncate"><span className="text-gray-400">Saving to:</span> {lockedProjectName ?? "project"}</span>
        ) : (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 text-sm max-w-[50%]">
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
        {mode === "DUAL" ? (
          <>
            <video ref={backVideoRef} className="hidden" autoPlay playsInline muted />
            <video ref={frontVideoRef} className="hidden" autoPlay playsInline muted />
            <canvas ref={dualCanvasRef} className="w-full h-full object-cover" />
            {!dualReady && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Starting dual camera…</div>}
          </>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-transform" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 z-30"><p className="text-white font-medium mb-1">Camera Unavailable</p><p className="text-gray-400 text-sm mb-4">{error}</p><button onClick={startCamera} className="bg-brand text-white px-5 py-2 rounded-full text-sm">Try Again</button></div>}
        {coords && <div className="absolute top-2 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">GPS on</div>}
        {toast && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-sm font-medium px-4 py-2 rounded-full pointer-events-none">{toast}</div>}
        {isRecording && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-mono text-sm font-semibold">{fmt(recSeconds)}</span>
          </div>
        )}

        {/* SCAN frame */}
        {mode === "SCAN" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {scanFlash && <div className="absolute inset-0 bg-white z-50" />}
            <div className="relative" style={{ width: "75%", aspectRatio: "8.5/11", maxHeight: "85%", boxShadow: "0 0 0 2000px rgba(0,0,0,0.45)" }}>
              {["tl", "tr", "bl", "br"].map((c) => (
                <div key={c} className={`absolute w-6 h-6 border-white border-2 ${c === "tl" ? "top-0 left-0 border-r-0 border-b-0" : c === "tr" ? "top-0 right-0 border-l-0 border-b-0" : c === "bl" ? "bottom-0 left-0 border-r-0 border-t-0" : "bottom-0 right-0 border-l-0 border-t-0"}`} />
              ))}
              <div className="absolute left-0 right-0 h-0.5 bg-brand-light/80" style={{ animation: "scan-line 2s linear infinite", top: "50%" }} />
            </div>
            {scannedPages.length > 0 && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
                {scannedPages.length} page{scannedPages.length !== 1 ? "s" : ""} scanned
              </div>
            )}
            <p className="absolute bottom-24 text-white/80 text-xs px-8 text-center">Align each page in the frame and tap capture — then Save PDF</p>
            {scannedPages.length > 0 && (
              <div className="absolute bottom-24 right-3 flex flex-col gap-1">
                {scannedPages.slice(-3).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={p} alt="" className="w-10 h-14 object-cover rounded border border-white/50" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* DUAL label */}
        {mode === "DUAL" && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none">DUAL VIDEO · you + the job site</div>
        )}

        {/* Last-captured thumbnail */}
        {lastThumb && !pending && mode !== "DUAL" && mode !== "SCAN" && (
          <div className="absolute bottom-3 left-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastThumb} alt="Last capture" className="w-14 h-14 rounded-xl object-cover border-2 border-white" />
              {captured > 0 && <span className="absolute -top-1 -right-1 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{captured}</span>}
            </div>
          </div>
        )}

        {/* Zoom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0.5, 1, 4].map((z) => (
            <button key={z} onClick={() => setZoom(z)} className={`px-3 py-1 rounded-full text-xs font-medium ${zoom === z ? "bg-brand text-white" : "bg-black/50 text-white"}`}>{z}x</button>
          ))}
        </div>

        {/* Post-capture description card */}
        {pending && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3 flex items-center gap-3 z-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.dataUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmUpload()} placeholder="Add description…" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light" />
            <button onClick={() => { setPending(null); setDescription("") }} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
            <button onClick={confirmUpload} disabled={uploading} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Done</button>
          </div>
        )}
      </div>

      {/* Shutter row */}
      <div className="bg-black px-4 py-4 flex items-center justify-between">
        <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"><ImageIcon className="w-5 h-5" /></button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFilePicked} className="hidden" />
        {isVideoMode ? (
          <button onClick={isRecording ? stopRecording : startRecording} disabled={!projectId} className="relative flex items-center justify-center disabled:opacity-40" style={{ width: 72, height: 72 }}>
            <div className={`absolute inset-0 rounded-full border-4 ${isRecording ? "border-red-500 animate-pulse" : "border-white"}`} />
            {isRecording ? <div className="w-7 h-7 bg-red-500 rounded-sm" /> : <div className="w-14 h-14 bg-red-500 rounded-full" />}
          </button>
        ) : (
          <button onClick={streaming ? capture : startCamera} disabled={uploading || !projectId} className="rounded-full bg-white ring-4 ring-white/30 disabled:opacity-40" style={{ width: 72, height: 72 }} title="Capture" />
        )}
        {mode === "SCAN" && scannedPages.length > 0 ? (
          <button onClick={() => setShowNameModal(true)} className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold" title="Save PDF"><Check className="w-5 h-5" /></button>
        ) : (
          <div className="w-12 h-12" />
        )}
      </div>

      {/* Mode tabs */}
      <div className="bg-black flex items-center justify-center gap-4 pb-6 overflow-x-auto">
        {MODES.map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`text-xs font-semibold tracking-wide whitespace-nowrap ${mode === m ? "text-brand-light" : "text-gray-400"}`}>{m}</button>
        ))}
      </div>

      {/* Name PDF modal */}
      {showNameModal && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-end" onClick={() => setShowNameModal(false)}>
          <div className="w-full bg-white rounded-t-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-1 text-gray-900">Name this document</h3>
            <p className="text-sm text-gray-500 mb-4">{scannedPages.length} page{scannedPages.length !== 1 ? "s" : ""} scanned</p>
            <input autoFocus value={docName} onChange={(e) => setDocName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveScannedPdf()} placeholder="e.g. Insurance Estimate, Permit" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-brand-light" />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700">Cancel</button>
              <button onClick={saveScannedPdf} disabled={uploading} className="flex-1 py-3 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">{uploading ? "Saving…" : "Save PDF"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag sheet */}
      {showTagSheet && (
        <div className="absolute inset-0 z-[60] flex items-end" onClick={() => setShowTagSheet(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Tag photos this session</span>
              <button onClick={() => setShowTagSheet(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Selected tags apply to every photo until you close the camera.</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => {
                const on = sessionTags.includes(t.id)
                return (
                  <button key={t.id} onClick={() => toggleSessionTag(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${on ? "border-brand bg-sky-50 text-brand" : "border-gray-300 text-gray-700"}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />{t.name}
                  </button>
                )
              })}
              {allTags.length === 0 && <p className="text-sm text-gray-400">No tags yet.</p>}
            </div>
            <button onClick={() => setShowTagSheet(false)} className="mt-4 w-full bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
