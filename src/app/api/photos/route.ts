import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFile } from "@/lib/supabase"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const projectId = searchParams.get("project_id")
  const tagId = searchParams.get("tag_id")
  const cursor = searchParams.get("cursor")

  const photos = await db.photo.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(tagId && { tags: { some: { tagId } } }),
    },
    include: {
      user: true,
      project: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { capturedAt: "desc" },
    take: 50,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  })

  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("photo") as File
  const projectId = form.get("project_id") as string
  const description = form.get("description") as string | null

  if (!file || !projectId) {
    return NextResponse.json({ error: "photo and project_id are required" }, { status: 400 })
  }

  const key = `photos/${projectId}/${randomUUID()}-${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { uri } = await uploadFile("nsr-cam", key, buffer, file.type)

  const photo = await db.photo.create({
    data: {
      projectId,
      userId: session.user?.id,
      storageKey: key,
      uri,
      description,
      capturedAt: new Date(),
    },
  })

  return NextResponse.json(photo, { status: 201 })
}
