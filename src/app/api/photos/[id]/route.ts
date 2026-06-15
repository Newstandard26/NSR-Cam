import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteFile } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const photo = await db.photo.findUnique({
    where: { id },
    include: {
      user: true,
      project: { select: { id: true, name: true, street1: true, city: true, state: true, postalCode: true } },
      tags: { include: { tag: true } },
      tasks: { include: { assignee: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  })
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(photo)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const k of ["description", "annotations", "brightness", "contrast", "saturation", "rotation", "hiddenFromTimeline", "projectId"]) {
    if (k in body) data[k] = body[k]
  }
  const photo = await db.photo.update({ where: { id }, data })
  return NextResponse.json(photo)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const photo = await db.photo.findUnique({ where: { id } })
  if (photo?.storageKey) {
    try { await deleteFile("nsr-cam", photo.storageKey) } catch {}
  }
  await db.photo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
