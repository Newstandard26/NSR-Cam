"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, RefreshCw, Check, Loader2, SwitchCamera, ImageIcon } from "lucide-react"

type Project = { id: string; name: string }

export function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState("")
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [captured, setCaptured] = useState(0)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : []
        setProjects(list)
        if (list[0]) setProjectId(list[0].id)
      })
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    )
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStreaming(true)
    } catch {
      setError("Camera unavailable or permission denied. Use the upload button instead.")
      setStreaming(false)
    }
  }, [facing])

  useEffect(() => {
    startCamera()
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [startCamera])

  async function uploadBlob(blob: Blob) {
    if (!projectId) {
      setError("Select a project first.")
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append("photo", blob, `capture-${Date.now()}.jpg`)
    fd.append("project_id", projectId)
    if (coords) {
      fd.append("lat", String(coords.lat))
      fd.append("lng", String(coords.lng))
    }
    const res = await fetch("/api/photos", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) setCaptured((c) => c + 1)
    else setError("Upload failed. Try again.")
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => blob && uploadBlob(blob), "image/jpeg", 0.92)
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadBlob(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project selector */}
      <div className="p-3 bg-gray-900">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-300 bg-black/70">
            {error}
          </div>
        )}

        {captured > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> {captured} uploaded
          </div>
        )}
        {coords && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">GPS on</div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center"
          title="Upload from library"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFilePicked} className="hidden" />

        <button
          onClick={streaming ? capture : startCamera}
          disabled={uploading || !projectId}
          className="w-18 h-18 rounded-full bg-white text-gray-900 flex items-center justify-center disabled:opacity-40 ring-4 ring-white/30"
          style={{ width: 72, height: 72 }}
          title={streaming ? "Capture" : "Start camera"}
        >
          {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-8 h-8" />}
        </button>

        <button
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center"
          title="Switch camera"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
