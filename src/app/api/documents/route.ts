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
  const docs = await db.document.findMany({
    where: { ...(projectId && { projectId }) },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const form = await req.formData()
    const file = form.get("file") as File
    const projectId = form.get("project_id") as string
    const name = (form.get("name") as string) || "Scanned Document"
    if (!file || !projectId) return NextResponse.json({ error: "file and project_id required" }, { status: 400 })

    const key = `documents/${projectId}/${randomUUID()}-${name}.pdf`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { uri } = await uploadFile("nsr-cam", key, buffer, "application/pdf")

    const doc = await db.document.create({
      data: { projectId, name, storageKey: key, uri, mimeType: "application/pdf", sizeBytes: file.size },
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Upload failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
