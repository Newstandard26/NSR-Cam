import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadFile } from "@/lib/supabase"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const projectId = req.nextUrl.searchParams.get("project_id")
  const videos = await db.video.findMany({
    where: { ...(projectId && { projectId }) },
    include: { user: true, project: { select: { id: true, name: true } } },
    orderBy: { capturedAt: "desc" },
  })
  return NextResponse.json(videos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get("video") as File
    const projectId = form.get("project_id") as string
    const durationRaw = form.get("duration") as string | null
    if (!file || !projectId) return NextResponse.json({ error: "video and project_id required" }, { status: 400 })

    const ext = file.type.includes("mp4") ? "mp4" : "webm"
    const key = `videos/${projectId}/${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { uri } = await uploadFile("nsr-cam", key, buffer, file.type || "video/webm")

    const video = await db.video.create({
      data: {
        projectId,
        userId: session.user?.id,
        storageKey: key,
        playbackUrl: uri,
        status: "PROCESSED",
        duration: durationRaw ? parseInt(durationRaw) : null,
        capturedAt: new Date(),
      },
    })
    return NextResponse.json(video, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Upload failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
