"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  MousePointer2, Pencil, Minus, ArrowUpRight, Circle as CircleIcon, Square as SquareIcon,
  Type, Clock, Sticker, RotateCw, Sliders, Trash2, Undo2, Redo2, X, Check,
} from "lucide-react"

const COLORS = ["#ffffff", "#000000", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#ec4899", "#ef4444"]
const THICKNESS = [{ label: "Thin", v: 2 }, { label: "Medium", v: 5 }, { label: "Thick", v: 10 }]

const EMOJI_STICKERS = [
  { id: "approved", text: "APPROVED", label: true },
  { id: "finished", text: "FINISHED", label: true },
  { id: "start", text: "START", label: true },
  { id: "end", text: "END", label: true },
  { id: "check", text: "✓", color: "#22c55e" },
  { id: "x", text: "✗", color: "#ef4444" },
  { id: "thumbs-up", text: "👍" },
  { id: "thumbs-down", text: "👎" },
  { id: "warning", text: "⚠️" },
  { id: "dot-red", text: "🔴" },
  { id: "dot-green", text: "🟢" },
  { id: "dot-yellow", text: "🟡" },
  { id: "dot-blue", text: "🔵" },
  { id: "circle-check", text: "✅" },
  { id: "circle-x", text: "❌" },
]

type Tool = "select" | "draw" | "line" | "arrow" | "circle" | "square" | "text" | "timestamp"

export function AnnotationEditor({
  photoUrl,
  photoId,
  existingAnnotations,
  brightness: b0 = 0,
  contrast: c0 = 0,
  saturation: s0 = 0,
  onClose,
  onSaved,
}: {
  photoUrl: string
  photoId: string
  existingAnnotations?: unknown
  brightness?: number
  contrast?: number
  saturation?: number
  onClose: () => void
  onSaved?: () => void
}) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null)
  const toolRef = useRef<Tool>("select")
  const colorRef = useRef(COLORS[7])
  const thickRef = useRef(5)
  const historyRef = useRef<string[]>([])
  const redoRef = useRef<string[]>([])

  const [tool, setTool] = useState<Tool>("select")
  const [color, setColor] = useState(COLORS[7])
  const [thick, setThick] = useState(5)
  const [showColors, setShowColors] = useState(false)
  const [showThick, setShowThick] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [brightness, setBrightness] = useState(b0)
  const [contrast, setContrast] = useState(c0)
  const [saturation, setSaturation] = useState(s0)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  toolRef.current = tool
  colorRef.current = color
  thickRef.current = thick

  const pushHistory = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    historyRef.current.push(JSON.stringify(c.toJSON()))
    redoRef.current = []
  }, [])

  // Init Fabric
  useEffect(() => {
    let disposed = false
    ;(async () => {
      const fabric = await import("fabric")
      if (disposed || !canvasElRef.current) return
      fabricRef.current = fabric
      const wrap = canvasElRef.current.parentElement!
      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: wrap.clientWidth,
        height: wrap.clientHeight,
        backgroundColor: "#111",
        selection: true,
      })
      canvasRef.current = canvas

      const img = await fabric.FabricImage.fromURL(photoUrl, { crossOrigin: "anonymous" })
      const scale = Math.min(canvas.width! / img.width!, canvas.height! / img.height!)
      img.scale(scale)
      img.set({ left: (canvas.width! - img.width! * scale) / 2, top: (canvas.height! - img.height! * scale) / 2, selectable: false, evented: false })
      canvas.backgroundImage = img
      canvas.renderAll()

      if (existingAnnotations) {
        try {
          await canvas.loadFromJSON(existingAnnotations)
          canvas.backgroundImage = img
          canvas.renderAll()
        } catch {}
      }

      // Shape drawing via mouse events
      let startX = 0, startY = 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let shape: any = null
      canvas.on("mouse:down", (opt: any) => {
        const t = toolRef.current
        if (t === "select" || t === "draw") return
        const p = canvas.getScenePoint(opt.e)
        startX = p.x; startY = p.y
        const stroke = colorRef.current
        const sw = thickRef.current
        if (t === "line" || t === "arrow") {
          shape = new fabric.Line([startX, startY, startX, startY], { stroke, strokeWidth: sw })
        } else if (t === "circle") {
          shape = new fabric.Ellipse({ left: startX, top: startY, rx: 0, ry: 0, stroke, strokeWidth: sw, fill: "transparent" })
        } else if (t === "square") {
          shape = new fabric.Rect({ left: startX, top: startY, width: 0, height: 0, stroke, strokeWidth: sw, fill: "transparent" })
        } else if (t === "text") {
          const it = new fabric.IText("", { left: startX, top: startY, fill: stroke, fontSize: 28, fontFamily: "Arial" })
          canvas.add(it); canvas.setActiveObject(it); it.enterEditing()
          setTool("select")
          return
        } else if (t === "timestamp") {
          const stamp = new fabric.IText(new Date().toLocaleString(), { left: startX, top: startY, fill: stroke, fontSize: 18, backgroundColor: "rgba(0,0,0,0.6)" })
          canvas.add(stamp); pushHistory(); setTool("select")
          return
        }
        if (shape) canvas.add(shape)
      })
      canvas.on("mouse:move", (opt: any) => {
        if (!shape) return
        const p = canvas.getScenePoint(opt.e)
        const t = toolRef.current
        if (t === "line" || t === "arrow") shape.set({ x2: p.x, y2: p.y })
        else if (t === "circle") shape.set({ rx: Math.abs(p.x - startX) / 2, ry: Math.abs(p.y - startY) / 2, left: Math.min(p.x, startX), top: Math.min(p.y, startY) })
        else if (t === "square") shape.set({ width: Math.abs(p.x - startX), height: Math.abs(p.y - startY), left: Math.min(p.x, startX), top: Math.min(p.y, startY) })
        canvas.renderAll()
      })
      canvas.on("mouse:up", (opt: any) => {
        if (!shape) return
        if (toolRef.current === "arrow") {
          const p = canvas.getScenePoint(opt.e)
          const angle = (Math.atan2(p.y - startY, p.x - startX) * 180) / Math.PI
          const head = new fabric.Triangle({ left: p.x, top: p.y, width: thickRef.current * 4, height: thickRef.current * 4, fill: colorRef.current, angle: angle + 90, originX: "center", originY: "center" })
          canvas.add(head)
        }
        shape = null
        pushHistory()
      })

      setReady(true)
      pushHistory()
    })()
    return () => {
      disposed = true
      canvasRef.current?.dispose?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl])

  // Tool switching
  useEffect(() => {
    const c = canvasRef.current
    const fabric = fabricRef.current
    if (!c || !fabric) return
    if (tool === "draw") {
      c.isDrawingMode = true
      c.freeDrawingBrush = new fabric.PencilBrush(c)
      c.freeDrawingBrush.color = color
      c.freeDrawingBrush.width = thick
    } else {
      c.isDrawingMode = false
      c.selection = tool === "select"
    }
  }, [tool, color, thick])

  // Live color adjust via CSS filter on the canvas element
  useEffect(() => {
    const el = canvasElRef.current?.parentElement?.querySelector("canvas.upper-canvas") as HTMLElement | null
    const lower = canvasElRef.current
    const filter = `brightness(${1 + brightness}) contrast(${1 + contrast}) saturate(${1 + saturation})`
    if (lower) lower.style.filter = filter
    if (el) el.style.filter = filter
  }, [brightness, contrast, saturation, ready])

  function addSticker(s: typeof EMOJI_STICKERS[number]) {
    const c = canvasRef.current, fabric = fabricRef.current
    if (!c || !fabric) return
    const cx = c.width / 2, cy = c.height / 2
    if (s.label) {
      const txt = new fabric.FabricText(s.text, { fontSize: 22, fontWeight: "bold", fill: "#000", originX: "center", originY: "center" })
      const rect = new fabric.Rect({ width: txt.width! + 28, height: txt.height! + 16, rx: 6, fill: "#fff", stroke: "#000", strokeWidth: 2, originX: "center", originY: "center" })
      const group = new fabric.Group([rect, txt], { left: cx, top: cy, originX: "center", originY: "center" })
      c.add(group); c.setActiveObject(group)
    } else {
      const t = new fabric.FabricText(s.text, { fontSize: 56, fill: s.color || "#000", left: cx, top: cy, originX: "center", originY: "center" })
      c.add(t); c.setActiveObject(t)
    }
    pushHistory(); setShowStickers(false)
  }

  function rotate() {
    const c = canvasRef.current
    const img = c?.backgroundImage
    if (!img) return
    img.rotate(((img.angle || 0) + 90) % 360)
    c.renderAll()
  }
  function clearAll() {
    const c = canvasRef.current
    if (!c) return
    if (!confirm("Remove all annotations?")) return
    c.getObjects().forEach((o: unknown) => c.remove(o))
    c.renderAll(); pushHistory()
  }
  function undo() {
    const c = canvasRef.current
    if (!c || historyRef.current.length < 2) return
    const cur = historyRef.current.pop()!
    redoRef.current.push(cur)
    const prev = historyRef.current[historyRef.current.length - 1]
    const img = c.backgroundImage
    c.loadFromJSON(JSON.parse(prev)).then(() => { c.backgroundImage = img; c.renderAll() })
  }
  function redo() {
    const c = canvasRef.current
    if (!c || redoRef.current.length === 0) return
    const next = redoRef.current.pop()!
    historyRef.current.push(next)
    const img = c.backgroundImage
    c.loadFromJSON(JSON.parse(next)).then(() => { c.backgroundImage = img; c.renderAll() })
  }

  async function save() {
    const c = canvasRef.current
    if (!c) return
    setSaving(true)
    await fetch(`/api/photos/${photoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annotations: c.toJSON(), brightness, contrast, saturation }),
    })
    setSaving(false)
    onSaved?.()
    onClose()
  }

  const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button onClick={onClick} title={title} className={`w-11 h-11 rounded-lg flex items-center justify-center ${active ? "bg-brand text-white" : "text-gray-300 hover:bg-gray-700"}`}>
      {children}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[60] bg-black flex">
      {/* Toolbar */}
      <div className="w-14 bg-gray-900 flex flex-col items-center py-3 gap-1 overflow-y-auto">
        <Btn title="Save & close" onClick={save}><Check className="w-5 h-5 text-green-400" /></Btn>
        <div className="h-px w-8 bg-gray-700 my-1" />
        <Btn active={tool === "select"} title="Select (V)" onClick={() => setTool("select")}><MousePointer2 className="w-5 h-5" /></Btn>
        <Btn active={tool === "draw"} title="Draw (D)" onClick={() => setTool("draw")}><Pencil className="w-5 h-5" /></Btn>
        <Btn active={tool === "line"} title="Line (L)" onClick={() => setTool("line")}><Minus className="w-5 h-5" /></Btn>
        <Btn active={tool === "arrow"} title="Arrow (A)" onClick={() => setTool("arrow")}><ArrowUpRight className="w-5 h-5" /></Btn>
        <Btn active={tool === "circle"} title="Circle (O)" onClick={() => setTool("circle")}><CircleIcon className="w-5 h-5" /></Btn>
        <Btn active={tool === "square"} title="Square (S)" onClick={() => setTool("square")}><SquareIcon className="w-5 h-5" /></Btn>
        <Btn active={tool === "text"} title="Text (T)" onClick={() => setTool("text")}><Type className="w-5 h-5" /></Btn>
        <Btn active={tool === "timestamp"} title="Timestamp" onClick={() => setTool("timestamp")}><Clock className="w-5 h-5" /></Btn>
        <Btn title="Color" onClick={() => { setShowColors((v) => !v); setShowThick(false); setShowStickers(false); setShowAdjust(false) }}>
          <span className="w-5 h-5 rounded-full border border-white" style={{ backgroundColor: color }} />
        </Btn>
        <Btn title="Thickness" onClick={() => { setShowThick((v) => !v); setShowColors(false); setShowStickers(false); setShowAdjust(false) }}>
          <span className="rounded-full bg-current" style={{ width: thick + 2, height: thick + 2 }} />
        </Btn>
        <Btn title="Sticker" onClick={() => { setShowStickers((v) => !v); setShowColors(false); setShowThick(false); setShowAdjust(false) }}><Sticker className="w-5 h-5" /></Btn>
        <div className="h-px w-8 bg-gray-700 my-1" />
        <Btn title="Rotate" onClick={rotate}><RotateCw className="w-5 h-5" /></Btn>
        <Btn title="Adjust color" onClick={() => { setShowAdjust((v) => !v); setShowColors(false); setShowThick(false); setShowStickers(false) }}><Sliders className="w-5 h-5" /></Btn>
        <div className="h-px w-8 bg-gray-700 my-1" />
        <Btn title="Clear all" onClick={clearAll}><Trash2 className="w-5 h-5" /></Btn>
        <Btn title="Undo" onClick={undo}><Undo2 className="w-5 h-5" /></Btn>
        <Btn title="Redo" onClick={redo}><Redo2 className="w-5 h-5" /></Btn>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasElRef} />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Loading editor…</div>}
        <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white z-10"><X className="w-7 h-7" /></button>

        {/* Popovers */}
        {showColors && (
          <div className="absolute left-2 top-2 bg-gray-800 p-2 rounded-lg grid grid-cols-4 gap-2 z-20">
            {COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setShowColors(false) }} className="w-7 h-7 rounded-full border border-gray-600" style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="col-span-4 w-full h-7 rounded" />
          </div>
        )}
        {showThick && (
          <div className="absolute left-2 top-2 bg-gray-800 p-3 rounded-lg flex items-center gap-4 z-20">
            {THICKNESS.map((t) => (
              <button key={t.v} onClick={() => { setThick(t.v); setShowThick(false) }} title={t.label} className="flex items-center justify-center w-8 h-8">
                <span className="rounded-full bg-white" style={{ width: t.v + 2, height: t.v + 2 }} />
              </button>
            ))}
          </div>
        )}
        {showStickers && (
          <div className="absolute left-2 top-2 bg-gray-800 p-3 rounded-lg w-56 max-h-[70vh] overflow-y-auto z-20">
            <p className="text-white text-sm font-medium mb-2">Add Sticker</p>
            <div className="grid grid-cols-3 gap-2">
              {EMOJI_STICKERS.map((s) => (
                <button key={s.id} onClick={() => addSticker(s)} className="bg-gray-700 hover:bg-gray-600 rounded-lg p-2 text-center text-white text-xs h-14 flex items-center justify-center">
                  <span className={s.label ? "font-bold text-[10px]" : "text-2xl"} style={{ color: s.color }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {showAdjust && (
          <div className="absolute left-2 top-2 bg-gray-800 p-4 rounded-lg w-64 z-20 space-y-3">
            <p className="text-white text-sm font-medium">Adjust Color</p>
            {([["Brightness", brightness, setBrightness], ["Contrast", contrast, setContrast], ["Saturation", saturation, setSaturation]] as const).map(([label, val, setter]) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-300"><span>{label}</span><button onClick={() => setter(0)} className="text-brand-light">Reset</button></div>
                <input type="range" min="-1" max="1" step="0.01" value={val} onChange={(e) => setter(parseFloat(e.target.value))} className="w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
